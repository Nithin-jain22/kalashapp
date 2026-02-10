import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io(); // uses same origin

export default function Sales() {
  const { authFetch, user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/api/sales");
      setSales(data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();

    socket.on("productUpdate", loadSales);

    return () => {
      socket.off("productUpdate", loadSales);
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-500">Loading sales...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sales History</h2>

      {error && <div className="text-red-500">{error}</div>}

      {sales.length === 0 ? (
        <div className="text-slate-500">No sales recorded yet.</div>
      ) : (
        sales.map((sale) => (
          <div key={sale.id} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="font-medium">{sale.product_name}</div>
            <div className="text-sm text-slate-600">
              Qty: {sale.quantity} | Sell: ₹{sale.actual_sell_price}
            </div>
            {user?.role === "leader" && (
              <div className="font-semibold text-green-600">
                Profit: ₹{sale.profit}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}