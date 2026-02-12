import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profits() {
  const { authFetch, user, socket } = useAuth();
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const loadProfits = async (pin, { setLoadingState = true } = {}) => {
    if (user?.role !== "leader") return;
    try {
      const pinValue = String(pin ?? "").trim();
      if (!pinValue) {
        setError("PIN required");
        return false;
      }
      if (setLoadingState) {
        setLoading(true);
      }

      const data = await authFetch("/api/profits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: String(pin) }),
      });

      setTotalProfit(data.totalProfit);
      setError("");
      return true;
    } catch (err) {
      console.error("PROFITS LOAD ERROR:", err);
      setError(err.message || "Failed to load profits");
      return false;
    } finally {
      if (setLoadingState) {
        setLoading(false);
      }
    }
  };

  const handleUnlock = async (event) => {
    event.preventDefault();
    if (!/^[0-9]{4}$/.test(pinInput)) {
      setError("Enter a 4-digit PIN");
      return;
    }

    const success = await loadProfits(pinInput);
    if (success) {
      setStoredPin(pinInput);
      setUnlocked(true);
      setPinInput("");
    }
  };

  useEffect(() => {
    if (user?.role !== "leader") {
      setLoading(false);
      return undefined;
    }

    if (socket && unlocked && storedPin) {
      const handleProductUpdate = () => {
        loadProfits(storedPin, { setLoadingState: false });
      };

      socket.on("productUpdate", handleProductUpdate);
      return () => {
        socket.off("productUpdate", handleProductUpdate);
      };
    }

    return undefined;
  }, [socket, user, unlocked, storedPin]);

  if (user?.role !== "leader") {
    return null;
  }

  if (loading && unlocked) {
    return <div className="p-4 text-slate-500">Loading profits...</div>;
  }

  if (!unlocked) {
    return (
      <div className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pinInput}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "");
              setPinInput(nextValue.slice(0, 4));
            }}
            placeholder="Enter 4-digit PIN"
            className="w-full rounded-lg border border-slate-300 px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

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