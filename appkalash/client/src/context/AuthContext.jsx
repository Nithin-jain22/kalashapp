import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

const isNativePlatform =
  typeof window !== "undefined" &&
  window.Capacitor &&
  typeof window.Capacitor.isNativePlatform === "function" &&
  window.Capacitor.isNativePlatform();

// ✅ API BASE:
// - Web → same origin ""
// - Android APK → absolute Render URL
const API_BASE = isNativePlatform ? "https://kalashapp.onrender.com" : "";

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

  /* -------------------- SOCKET -------------------- */
  useEffect(() => {
    if (!token || !team?.id) return;

    const socketInstance = io(API_BASE, {
      transports: ["websocket"],
    });

    socketInstance.emit("joinTeam", { teamId: team.id });
    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [token, team]);

  /* -------------------- STORAGE -------------------- */
  useEffect(() => {
    token
      ? localStorage.setItem("tsp_token", token)
      : localStorage.removeItem("tsp_token");
  }, [token]);

  useEffect(() => {
    user
      ? localStorage.setItem("tsp_user", JSON.stringify(user))
      : localStorage.removeItem("tsp_user");
  }, [user]);

  useEffect(() => {
    team
      ? localStorage.setItem("tsp_team", JSON.stringify(team))
      : localStorage.removeItem("tsp_team");
  }, [team]);

  const parseResponse = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      return { isJson: true, data };
    }
    const text = await res.text();
    return { isJson: false, data: text };
  };

  /* -------------------- SAFE FETCH -------------------- */
  const authFetch = useMemo(() => {
    return async (url, options = {}) => {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });

      const { isJson, data } = await parseResponse(res);

      if (!res.ok) {
        const message = isJson && data?.message ? data.message : "Request failed";
        throw new Error(message);
      }

      if (!isJson) {
        throw new Error("Server returned non-JSON response");
      }

      return data;
    };
  }, [token]);

  /* -------------------- AUTH -------------------- */
  const login = async ({ username, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const { isJson, data } = await parseResponse(res);

    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Login failed";
      throw new Error(message);
    }

    if (!isJson) {
      throw new Error("Server returned non-JSON response");
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

    const { isJson, data } = await parseResponse(res);

    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Registration failed";
      throw new Error(message);
    }

    if (!isJson) {
      throw new Error("Server returned non-JSON response");
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

    const { isJson, data } = await parseResponse(res);

    if (!res.ok) {
      const message = isJson && data?.message ? data.message : "Join failed";
      throw new Error(message);
    }

    if (!isJson) {
      throw new Error("Server returned non-JSON response");
    }

    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTeam(null);
    socket?.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}