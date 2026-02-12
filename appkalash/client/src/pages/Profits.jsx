import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profits() {
  const { authFetch, user, socket } = useAuth();
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const loadProfits = async (pinValue, { setLoadingState = true } = {}) => {
    if (user?.role !== "leader") return;

    try {
      if (setLoadingState) setLoading(true);

      const data = await authFetch("/api/profits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: String(pinValue) }),
      });

      setTotalProfit(Number(data?.totalProfit || 0));
      setError("");
      setUnlocked(true);
    } catch (err) {
      console.error("PROFITS LOAD ERROR:", err);
      setError(err.message || "Failed to load profits");
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      setError("Enter a 4-digit PIN");
      return;
    }

    await loadProfits(pin);
  };

  useEffect(() => {
    if (user?.role !== "leader") return;

    if (socket && unlocked) {
      const handleProductUpdate = () => {
        loadProfits(pin, { setLoadingState: false });
      };

      socket.on("productUpdate", handleProductUpdate);

      return () => {
        socket.off("productUpdate", handleProductUpdate);
      };
    }
  }, [socket, user, unlocked, pin]);

  // 🚫 Hide completely from members
  if (user?.role !== "leader") return null;

  // PIN MODAL
  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold">Enter PIN</h2>

          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPin(val.slice(0, 4));
              }}
              placeholder="4-digit PIN"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Unlock"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PROFITS VIEW
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Total Profit</h2>

      {error && <div className="text-red-500">{error}</div>}

      <div className="rounded-xl bg-white p-6 text-3xl font-bold text-green-600">
        ₹{totalProfit}
      </div>
    </div>
  );
}