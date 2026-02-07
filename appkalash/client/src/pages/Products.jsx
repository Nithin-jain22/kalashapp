import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Products() {
  const { authFetch, user, socket } = useAuth();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    buyPrice: "",
    targetPrice: "",
  });
  const [saleForm, setSaleForm] = useState({});

  const fetchProducts = async () => {
    try {
      const data = await authFetch("/api/products");
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const handleUpdate = () => fetchProducts();
    socket.on("productUpdate", handleUpdate);
    return () => socket.off("productUpdate", handleUpdate);
  }, [socket]);

  const handleAddProduct = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await authFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", quantity: "", buyPrice: "", targetPrice: "" });
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSell = async (productId) => {
    setError("");
    try {
      await authFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity: saleForm[productId]?.quantity || "",
          actualSellPrice: saleForm[productId]?.actualSellPrice || "",
        }),
      });
      setSaleForm((prev) => ({ ...prev, [productId]: { quantity: "", actualSellPrice: "" } }));
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Products</h2>
        <p className="text-sm text-slate-500">Track inventory and sales targets.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {user?.role === "leader" && (
        <form
          className="rounded-2xl bg-white p-5 shadow-sm"
          onSubmit={handleAddProduct}
        >
          <h3 className="text-sm font-semibold text-slate-700">Add product</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              placeholder="Name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <input
              placeholder="Quantity"
              inputMode="numeric"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, quantity: event.target.value }))
              }
              required
            />
            <input
              placeholder="Buy price"
              inputMode="decimal"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.buyPrice}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, buyPrice: event.target.value }))
              }
              required
            />
            <input
              placeholder="Target price"
              inputMode="decimal"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.targetPrice}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetPrice: event.target.value }))
              }
              required
            />
          </div>
          <button className="mt-4 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
            Add product
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {product.name}
                </h3>
                <p className="text-lg font-bold text-indigo-600">
                  Target: ${product.targetPrice}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Qty: {product.quantity}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Sell</div>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                <input
                  placeholder="Quantity"
                  inputMode="numeric"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={saleForm[product.id]?.quantity || ""}
                  onChange={(event) =>
                    setSaleForm((prev) => ({
                      ...prev,
                      [product.id]: {
                        ...prev[product.id],
                        quantity: event.target.value,
                      },
                    }))
                  }
                />
                <input
                  placeholder="Actual sell price"
                  inputMode="decimal"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={saleForm[product.id]?.actualSellPrice || ""}
                  onChange={(event) =>
                    setSaleForm((prev) => ({
                      ...prev,
                      [product.id]: {
                        ...prev[product.id],
                        actualSellPrice: event.target.value,
                      },
                    }))
                  }
                />
                <button
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => handleSell(product.id)}
                >
                  Submit sale
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Actual sell price must be at least the target price.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
