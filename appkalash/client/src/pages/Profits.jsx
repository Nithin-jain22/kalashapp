import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profits() {
  const { authFetch } = useAuth();
  const [pin, setPin] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const res = await authFetch("/api/profits", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profits</h2>
        <p className="text-sm text-slate-500">
          Protected by your 4-digit PIN.
        </p>
      </div>

      <form className="rounded-2xl bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <label className="text-xs font-semibold text-slate-500">Enter PIN</label>
        <div className="mt-2 flex gap-3">
          <input
            inputMode="numeric"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            required
          />
          <button className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
            Unlock
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {data && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total profit</div>
          <div className="text-2xl font-semibold text-emerald-600">
            ₹{data.totalProfit}
          </div>
          <div className="mt-4 grid gap-3">
            {data.sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {sale.productName}
                </div>
                <div className="text-xs text-slate-500">
                  {sale.quantity} units · ₹{sale.actualSellPrice} sell
                </div>
                <div className="text-xs text-emerald-600">Profit ₹{sale.profit}</div>
              </div>
            ))}
            {data.sales.length === 0 && (
              <div className="text-sm text-slate-500">No sales yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
