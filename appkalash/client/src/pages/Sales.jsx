import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sales() {
  const { authFetch } = useAuth();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await authFetch("/api/sales");
        setSales(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSales();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sales History</h2>
        <p className="text-sm text-slate-500">
          All completed sales for your team.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {sales.map((sale) => (
          <div key={sale.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {sale.productName}
                </h3>
                <p className="text-xs text-slate-500">
                  Sold {sale.quantity} units at ${sale.actualSellPrice}
                </p>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-400">
              {new Date(sale.soldAt).toLocaleString()}
            </div>
          </div>
        ))}

        {sales.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
            No sales recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}