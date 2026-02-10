import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function TeamManagement() {
  const { authFetch, socket } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTeam = async () => {
    const data = await authFetch("/api/teams/me");
    const normalizedTeam = data?.team ?? data;
    setTeam(normalizedTeam);
  };

  const loadMembers = async () => {
    const data = await authFetch("/api/teams/members");
    setMembers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const loadAll = async () => {
      setError("");
      try {
        await Promise.all([loadTeam(), loadMembers()]);
      } catch (err) {
        setError(err.message || "Failed to load team info");
      } finally {
        setLoading(false);
        setMembersLoading(false);
      }
    };

    loadAll();
  }, [authFetch]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleMemberUpdate = () => loadMembers();
    socket.on("memberUpdate", handleMemberUpdate);
    return () => socket.off("memberUpdate", handleMemberUpdate);
  }, [socket]);

  const handleApprove = async (memberId) => {
    setError("");
    try {
      await authFetch(`/api/teams/members/${memberId}/approve`, {
        method: "PATCH",
      });
      await loadMembers();
    } catch (err) {
      setError(err.message || "Failed to approve member");
    }
  };

  const pendingMembers = members.filter((m) => m.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");

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
              {team.code || "—"}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Pending Requests
        </h3>

        {membersLoading && (
          <div className="mt-3 text-sm text-slate-400">
            Loading members…
          </div>
        )}

        {!membersLoading && pendingMembers.length === 0 && (
          <div className="mt-3 text-sm text-slate-500">
            No pending requests.
          </div>
        )}

        {!membersLoading && pendingMembers.length > 0 && (
          <ul className="mt-3 space-y-3">
            {pendingMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">{member.name}</span>{" "}
                  <span className="text-slate-500">@{member.username}</span>
                </div>
                <button
                  onClick={() => handleApprove(member.id)}
                  className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">
          Active Members
        </h3>

        {!membersLoading && activeMembers.length === 0 && (
          <div className="mt-3 text-sm text-slate-500">
            No active members yet.
          </div>
        )}

        {!membersLoading && activeMembers.length > 0 && (
          <ul className="mt-3 space-y-2">
            {activeMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">{member.name}</span>{" "}
                  <span className="text-slate-500">@{member.username}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600">
                  Active
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}