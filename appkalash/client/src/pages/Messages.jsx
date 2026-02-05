import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Messages() {
  const { authFetch, user, socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const fetchMessages = async () => {
    try {
      const data = await authFetch("/api/messages");
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handleMessage = (message) => {
      setMessages((prev) => [message, ...prev]);
    };
    socket.on("teamMessage", handleMessage);
    return () => socket.off("teamMessage", handleMessage);
  }, [socket]);

  const handleSend = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const message = await authFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setText("");
      setMessages((prev) => [message, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Team Messages</h2>
        <p className="text-sm text-slate-500">
          Send updates to your team in real time.
        </p>
      </div>

      {user?.role === "leader" && (
        <form
          className="rounded-2xl bg-white p-5 shadow-sm"
          onSubmit={handleSend}
        >
          <label className="text-xs font-semibold text-slate-500">
            New message
          </label>
          <textarea
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
          <button className="mt-3 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
            Send message
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-700">{message.text}</p>
            <div className="mt-2 text-xs text-slate-400">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
