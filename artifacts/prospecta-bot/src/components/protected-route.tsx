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

  const status = (session?.billingStatus || "").toLowerCase();
  const isAdmin = session?.role === "admin";
  const hasActiveBilling = status === "active";
  const isOnSubscriptionPage = typeof window !== "undefined" && (
    window.location.pathname.includes("/assinatura") ||
    window.location.pathname.includes("/app/assinatura")
  );

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/login");
      return;
    }
    if (!allow.includes(session.role)) {
      navigate(session.role === "admin" ? "/admin/dashboard" : "/app/dashboard");
      return;
    }

    // Bloqueio de Assinatura (Paywall)
    // Apenas "admin" é isento — owner e user precisam de plano ativo.
    if (!isAdmin && !hasActiveBilling && !isOnSubscriptionPage) {
      navigate("/app/assinatura");
    }
  }, [allow, loading, navigate, session, isAdmin, hasActiveBilling, isOnSubscriptionPage]);

  if (loading || !session || !allow.includes(session.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Preparando o painel...</p>
        </div>
      </div>
    );
  }

  // Bloqueia renderização do conteúdo se billing inativo (previne flash de conteúdo)
  if (!isAdmin && !hasActiveBilling && !isOnSubscriptionPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
