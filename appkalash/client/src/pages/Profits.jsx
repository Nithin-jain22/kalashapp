import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profits() {
  const { authFetch, user, socket } = useAuth();
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfits = async ({ setLoadingState = true } = {}) => {
    if (user?.role !== "leader") return;

    try {
      if (setLoadingState) setLoading(true);

      const data = await authFetch("/api/profits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      setTotalProfit(Number(data?.totalProfit || 0));
      setError("");
    } catch (err) {
      console.error("PROFITS LOAD ERROR:", err);
      setError(err.message || "Failed to load profits");
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "leader") {
      setLoading(false);
      return;
    }

    loadProfits();

    if (socket) {
      const handleProductUpdate = () => {
        loadProfits({ setLoadingState: false });
      };

      socket.on("productUpdate", handleProductUpdate);

      return () => {
        socket.off("productUpdate", handleProductUpdate);
      };
    }
  }, [socket, user]);

  // 🚫 Hide completely from members
  if (user?.role !== "leader") return null;

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