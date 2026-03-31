import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradientDots } from "@/components/ui/gradient-dots";
import { useAuth } from "@/lib/auth";

export default function AdminAccessPage() {
  const { session, loginAs } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (session?.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [navigate, session]);

  async function handleAdminAccess() {
    await loginAs("admin");
    navigate("/admin/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#eef8f3_0%,#f4f7fb_100%)] px-4">
      <GradientDots
        dotSize={6}
        spacing={16}
        duration={42}
        colorCycleDuration={12}
        className="pointer-events-none absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(circle_at_center,black_16%,transparent_84%)]"
      />
      <Card className="relative z-10 w-full max-w-md border-white/80 bg-white/95 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4">Acesso interno</CardTitle>
          <CardDescription>
            Entrada administrativa separada da área pública do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="h-11 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            onClick={() => void handleAdminAccess()}
          >
            Entrar no painel administrativo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
