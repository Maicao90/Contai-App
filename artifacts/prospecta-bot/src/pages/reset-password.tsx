import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { GradientDots } from "@/components/ui/gradient-dots";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api";

type ResetPasswordResponse = {
  ok: boolean;
  message: string;
};

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") ?? "", []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!token) {
      setFeedback("Esse link não e valido.");
      return;
    }

    if (password.length < 6) {
      setFeedback("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("A confirmacao da senha não confere.");
      return;
    }

    setLoading(true);

    try {
      const result = await postJson<ResetPasswordResponse>("/auth/reset-password", {
        token,
        password,
      });
      setFeedback(result.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possivel redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#081512] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.18),transparent_28%),linear-gradient(135deg,#07110f_0%,#0b1916_38%,#0f1618_100%)]" />
      <GradientDots
        dotSize={6}
        spacing={14}
        duration={38}
        colorCycleDuration={10}
        className="pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(circle_at_center,black_18%,transparent_86%)]"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center">
        <Card className="w-full rounded-[28px] border border-white/10 bg-slate-950/65 text-white shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <CardHeader className="space-y-5 p-5 sm:p-6">
            <BrandLogo variant="mobile" className="max-w-[180px]" />
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-emerald-300">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Criar nova senha</CardTitle>
                <CardDescription className="mt-2 text-sm leading-7 text-slate-300">
                  Defina a nova senha da sua conta. Depois disso, você volta para o login normalmente.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Nova senha</p>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimo de 6 caracteres"
                  className="h-12 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Confirmar nova senha</p>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-12 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-slate-500"
                />
              </div>

              {feedback ? (
                <p className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {feedback}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </Button>
                <Link href="/login">
                  <Button type="button" variant="outline" className="h-12 rounded-2xl border-white/12 bg-white/5 text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

