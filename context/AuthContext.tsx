"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Keep this aligned with your Mongoose enum
type Role = "user" | "moderator" | "admin";

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
  skills?: string[];
}

interface ProfileResponse {
  authUser: {
    _id: string; // required
    email: string;
    name: string;
    role: Role;
    createdAt?: string;
    skills?: string[];
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAuthUser(
  input: ProfileResponse["authUser"]
): AuthUser | null {
  return input
    ? {
        _id: input._id,
        email: input.email,
        name: input.name,
        role: input.role,
        createdAt: input.createdAt,
        skills: input.skills ?? [],
      }
    : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!alive) return;
        if (!res.ok) {
          setUser(null);
        } else {
          const data: ProfileResponse = await res.json();
          setUser(normalizeAuthUser(data.authUser));
        }
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const form = new FormData();
      form.set("email", email);
      form.set("password", password);
      if (remember) form.set("remember", "on");

      const res = await fetch("/api/users/login", {
        method: "POST",
        body: form,
      });
      if (!res.ok) return false;
      const { success } = (await res.json()) as { success: boolean };
      if (!success) return false;

      const profile = (await (
        await fetch("/api/profile")
      ).json()) as ProfileResponse;
      setUser(normalizeAuthUser(profile.authUser));
      return true;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
