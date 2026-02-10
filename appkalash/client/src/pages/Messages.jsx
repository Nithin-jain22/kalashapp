import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Messages() {
  const { authFetch, user, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/api/messages");
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      if (!message || !message.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [message, ...prev]
      );
    };

    socket.on("teamMessage", handleMessage);
    return () => socket.off("teamMessage", handleMessage);
  }, [socket]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const message = await authFetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      setText("");
      setMessages((prev) => [message, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to send message");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Team Messages</h2>
        <p className="text-sm text-slate-500">
          Send updates to your team in real time.
        </p>
      </div>

      {user?.role === "leader" && (
        <form onSubmit={handleSend} className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="text-xs font-semibold text-slate-500">
            New message
          </label>
          <textarea
            rows={3}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <button className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
            Send message
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading messages…</div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
          No messages yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm">{m.text}</p>
              <div className="mt-2 text-xs text-slate-400">
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}