import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function TeamManagement() {
  const { authFetch } = useAuth();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const data = await authFetch("/api/teams/me");
        setTeam(data);
      } catch (err) {
        setError(err.message || "Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [authFetch]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Team Management
        </h2>
        <p className="text-sm text-slate-500">
          Approve new members and view team info.
        </p>

        {loading && (
          <div className="mt-4 text-sm text-slate-400">
            Loading team info…
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && team && (
          <div className="mt-4 text-sm text-slate-700">
            Team code:{" "}
            <span className="ml-1 rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-600">
              {team.code}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}