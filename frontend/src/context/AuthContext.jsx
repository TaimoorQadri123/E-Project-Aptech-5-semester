import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const res = await client.get("/auth/me");
      setUser(res.data.data);
      applyTheme(res.data.data?.preferences?.theme || "light");
    } catch {
      setUser(null);
      applyTheme("light");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function signup(formData) {
    const res = await client.post("/auth/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  async function login(login, password) {
    const res = await client.post("/auth/login", { login, password });
    setUser(res.data.user);
    applyTheme(res.data.user?.preferences?.theme || "light");
    return res.data;
  }

  function updateTheme(theme) {
    applyTheme(theme);
  }

  async function logout() {
    await client.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, setUser, refreshUser: loadUser, updateTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
