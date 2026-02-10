import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

// Use production URL (same origin) in production, localhost in development
const API_BASE =
  import.meta.env.MODE === "production"
    ? "" // Same origin for production (Render single server)
    : "http://localhost:4000";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("tsp_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("tsp_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [team, setTeam] = useState(() => {
    const raw = localStorage.getItem("tsp_team");
    return raw ? JSON.parse(raw) : null;
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && user && team?.id) {
      const socketInstance = io(API_BASE, { transports: ["websocket"] });
      socketInstance.emit("joinTeam", { teamId: team.id });
      setSocket(socketInstance);
      return () => socketInstance.disconnect();
    }
    return undefined;
  }, [token, user, team]);

  useEffect(() => {
    if (token) localStorage.setItem("tsp_token", token);
    else localStorage.removeItem("tsp_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("tsp_user", JSON.stringify(user));
    else localStorage.removeItem("tsp_user");
  }, [user]);

  useEffect(() => {
    if (team) localStorage.setItem("tsp_team", JSON.stringify(team));
    else localStorage.removeItem("tsp_team");
  }, [team]);

  const parseApiResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return { isJson: true, data: await res.json() };
    }
    return { isJson: false, data: await res.text() };
  };

  const authFetch = useMemo(() => {
    return async (url, options = {}) => {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const { isJson, data } = await parseApiResponse(res);
      if (!res.ok) {
        const message = isJson && data?.message ? data.message : "Request failed";
        throw new Error(message);
      }
      if (!isJson) {
        throw new Error("Unexpected response format");
      }
      return data;
    };
  }, [token]);

  const login = async ({ username, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const { isJson, data } = await parseApiResponse(res);
    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Login failed";
      throw new Error(message);
    }
    if (!isJson) {
      throw new Error("Unexpected response format");
    }
    setToken(data.token);
    setUser(data.user);
    setTeam(data.team);
  };

  const registerLeader = async (payload) => {
    const res = await fetch(`${API_BASE}/api/auth/register-leader`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { isJson, data } = await parseApiResponse(res);
    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Registration failed";
      throw new Error(message);
    }
    if (!isJson) {
      throw new Error("Unexpected response format");
    }
    setToken(data.token);
    setUser(data.user);
    setTeam(data.team);
  };

  const joinTeam = async (payload) => {
    const res = await fetch(`${API_BASE}/api/auth/join-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { isJson, data } = await parseApiResponse(res);
    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Request failed";
      throw new Error(message);
    }
    if (!isJson) {
      throw new Error("Unexpected response format");
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTeam(null);
  };

  const value = {
    token,
    user,
    team,
    socket,
    authFetch,
    login,
    registerLeader,
    joinTeam,
    logout,
    setTeam,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
