import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function JoinTeam() {
  const { joinTeam } = useAuth();
  const [form, setForm] = useState({
    teamCode: "",
    name: "",
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await joinTeam({
        teamCode: form.teamCode,
        name: form.name,
        username: form.username,
        password: form.password,
      });

      setMessage("Request sent for approval");
      setForm({ teamCode: "", name: "", username: "", password: "" });
    } catch (err) {
      setError(err.message || "Failed to request access");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Join a Team</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the team code provided by your leader.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
              {message}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Team code
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.teamCode}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, teamCode: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Username
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </div>
            <button className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
              Request access
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link className="font-semibold text-brand-500" to="/login">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
