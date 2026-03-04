import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setToken, clearToken, apiGet } from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt: string;
  twoFactorEnabled: boolean;
};

export type LoginResult =
  | { twoFactorRequired: false }
  | { twoFactorRequired: true; challengeToken: string; provider: "supabase"; message?: string };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyLoginOtp: (challengeToken: string, otp: string) => Promise<void>;
  resendLoginOtp: (challengeToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: "ADMIN" | "STAFF") => Promise<void>;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("pharmacy_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setToken(token);
    apiGet<User>("/api/me")
      .then((u) => setUser(u))
      .catch(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [logout]);

  const setAuth = useCallback((u: User, t: string) => {
    setToken(t);
    setTokenState(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Login failed");
    }

    const data = await res.json() as
      | { twoFactorRequired: false; user: User; token: string }
      | { twoFactorRequired: true; challengeToken: string; provider: "supabase"; message?: string };

    if (data.twoFactorRequired) {
      return {
        twoFactorRequired: true,
        challengeToken: data.challengeToken,
        provider: data.provider,
        message: data.message,
      };
    }

    setAuth(data.user, data.token);
    return { twoFactorRequired: false };
  }, [setAuth]);

  const verifyLoginOtp = useCallback(async (challengeToken: string, otp: string) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken, otp }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "OTP verification failed");
    }
    const data = await res.json() as { user: User; token: string };
    setAuth(data.user, data.token);
  }, [setAuth]);

  const resendLoginOtp = useCallback(async (challengeToken: string) => {
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Failed to resend OTP");
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: "ADMIN" | "STAFF" = "STAFF") => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Registration failed");
      }
      const data = await res.json() as { user: User; token: string };
      setAuth(data.user, data.token);
    },
    [setAuth]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyLoginOtp, resendLoginOtp, register, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
