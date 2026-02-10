import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItemClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 min-h-12 flex items-center text-sm font-medium touch-manipulation ${
    isActive
      ? "bg-brand-500 text-white"
      : "text-slate-700 hover:bg-slate-100"
  }`;

export default function Layout() {
  const { user, team, authFetch, setTeam, logout, socket } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [popup, setPopup] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return undefined;
    const handleMessage = (message) => {
      if (user?.role === "member") {
        setPopup(message);
        setTimeout(() => setPopup(null), 5000);
      }
    };
    socket.on("teamMessage", handleMessage);
    return () => socket.off("teamMessage", handleMessage);
  }, [socket, user]);

  useEffect(() => {
    if (!user || team?.code) return;
    let isActive = true;
    const loadTeam = async () => {
      try {
        const data = await authFetch("/api/teams/me");
        const normalizedTeam = data?.team ?? data;
        if (isActive && normalizedTeam?.id) {
          setTeam(normalizedTeam);
        }
      } catch {
        // Keep placeholder when team data is unavailable.
      }
    };
    loadTeam();
    return () => {
      isActive = false;
    };
  }, [authFetch, setTeam, team, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/products", label: "Products" },
    { to: "/sales", label: "Sales" },
    { to: "/messages", label: "Messages" },
  ];

  if (user?.role === "leader") {
    links.push({ to: "/team", label: "Team Management" });
    links.push({ to: "/profits", label: "Profits" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-slate-200 p-3 min-h-12 min-w-12 flex items-center justify-center text-slate-700 lg:hidden touch-manipulation"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <Link to="/products" className="text-lg font-semibold text-slate-900">
              TeamStock Pro
            </Link>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-medium text-slate-700">{user?.name}</div>
            <div>{team?.name}</div>
          </div>
        </div>
      </header>

      {popup && (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 shadow-sm">
            <div className="font-semibold">New team message</div>
            <p className="mt-1">{popup.text}</p>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-4 px-2 sm:px-4 pb-10 pt-6 flex-col lg:flex-row">
        <aside
          className={`fixed inset-0 top-16 z-10 w-full sm:w-64 flex-shrink-0 rounded-none sm:rounded-2xl bg-white p-4 shadow-sm sm:static lg:block ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navItemClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-6 w-full rounded-lg border border-slate-200 px-3 py-3 min-h-12 text-sm font-medium text-slate-600 hover:bg-slate-100 touch-manipulation"
            onClick={handleLogout}
          >
            Logout
          </button>
          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-semibold text-slate-700">Team Code</div>
            <div className="text-sm tracking-widest text-slate-900">
              {team?.code || "—"}
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
