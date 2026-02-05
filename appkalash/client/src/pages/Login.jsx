import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, registerLeader } = useAuth();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [leaderForm, setLeaderForm] = useState({
    teamName: "",
    leaderName: "",
    username: "",
    password: "",
    pin: "",
  });

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(loginForm);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await registerLeader(leaderForm);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">TeamStock Pro</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage teams, products, and sales in real time.
            </p>
          </div>

          <div className="mb-6 flex justify-center gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "login"
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === "leader"
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => setMode("leader")}
            >
              Create Team
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Username
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
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
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <button className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
                Sign in
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Team name
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={leaderForm.teamName}
                  onChange={(event) =>
                    setLeaderForm((prev) => ({
                      ...prev,
                      teamName: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Leader name
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={leaderForm.leaderName}
                  onChange={(event) =>
                    setLeaderForm((prev) => ({
                      ...prev,
                      leaderName: event.target.value,
                    }))
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
                  value={leaderForm.username}
                  onChange={(event) =>
                    setLeaderForm((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
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
                  value={leaderForm.password}
                  onChange={(event) =>
                    setLeaderForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Profit PIN (4 digits)
                </label>
                <input
                  inputMode="numeric"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={leaderForm.pin}
                  onChange={(event) =>
                    setLeaderForm((prev) => ({
                      ...prev,
                      pin: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <button className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
                Create team
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            Need to join a team?{" "}
            <Link className="font-semibold text-brand-500" to="/join">
              Join here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
