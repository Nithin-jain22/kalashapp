import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io();

export default function Profits() {
  const { authFetch } = useAuth();
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfits = async () => {
    try {
      setLoading(true);
      const pin = prompt("Enter 4-digit PIN");
      if (!pin) return;

      const data = await authFetch("/api/profits", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });

      setTotalProfit(data.totalProfit || 0);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load profits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfits();

    socket.on("productUpdate", loadProfits);

    return () => {
      socket.off("productUpdate", loadProfits);
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading profits...</div>;
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