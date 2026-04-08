import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { postJson, requestJson } from "@/lib/api";

export type SessionRole = "user" | "owner" | "admin";

export type SessionData = {
  token: string;
  role: SessionRole;
  userId: number | null;
  householdId: number | null;
  memberId: number | null;
  name: string;
  email: string | null;
  billingStatus?: string;
  expiresAt: number;
};

type AuthContextValue = {
  session: SessionData | null;
  loading: boolean;
  loginAs: (role: SessionRole) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await requestJson<{ session: SessionData | null }>("/auth/session");
      setSession(data.session);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  async function loginAs(role: SessionRole) {
    const data = await postJson<{ session: SessionData }>("/auth/demo-login", { role });
    setSession(data.session);
  }

  async function login(identifier: string, password: string) {
    const data = await postJson<{ session: SessionData }>("/auth/login", {
      identifier,
      password,
    });
    setSession(data.session);
  }

  async function logout() {
    await postJson("/auth/logout", {});
    setSession(null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      loginAs,
      login,
      logout,
      refresh,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
