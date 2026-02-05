import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function TeamManagement() {
  const { authFetch, team } = useAuth();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      const data = await authFetch("/api/teams/members");
      setMembers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const approveMember = async (memberId) => {
    setError("");
    try {
      await authFetch(`/api/teams/members/${memberId}/approve`, {
        method: "POST",
      });
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const rejectMember = async (memberId) => {
    setError("");
    try {
      await authFetch(`/api/teams/members/${memberId}`, {
        method: "DELETE",
      });
      fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Team Management
        </h2>
        <p className="text-sm text-slate-500">
          Approve new members and view team info.
        </p>
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Team code: <span className="font-semibold text-slate-900">{team?.code}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {member.name}
                </div>
                <div className="text-xs text-slate-500">@{member.username}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {member.status}
              </div>
            </div>
            {member.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => approveMember(member.id)}
                >
                  Approve
                </button>
                <button
                  className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => rejectMember(member.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
            No team members yet.
          </div>
        )}
      </div>
    </div>
  );
}
