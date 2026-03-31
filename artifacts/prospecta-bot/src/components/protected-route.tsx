import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, type SessionRole } from "@/lib/auth";

type ProtectedRouteProps = {
  allow: SessionRole[];
  children: React.ReactNode;
};

export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const { loading, session } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/login");
      return;
    }
    if (!allow.includes(session.role)) {
      navigate(session.role === "admin" ? "/admin/dashboard" : "/app/dashboard");
    }
  }, [allow, loading, navigate, session]);

  if (loading || !session || !allow.includes(session.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Preparando o painel...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
