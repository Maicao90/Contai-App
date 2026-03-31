import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { GradientDots } from "@/components/ui/gradient-dots";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api";

type ForgotPasswordResponse = {
  ok: boolean;
  message: string;
  resetUrl: string | null;
};

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setResetUrl(null);
    setLoading(true);

    try {
      const result = await postJson<ForgotPasswordResponse>("/auth/forgot-password", {
        identifier,
      });
      setFeedback(result.message);
      setResetUrl(result.resetUrl);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possivel processar o pedido.");
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
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Recuperar acesso</CardTitle>
                <CardDescription className="mt-2 text-sm leading-7 text-slate-300">
                  Informe seu e-mail ou telefone. Nesta etapa, o sistema gera o link interno de redefinicao enquanto o envio de e-mail ainda não foi ligado.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">E-mail ou telefone</p>
                <Input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="você@contai.app ou (21) 99999-9999"
                  className="h-12 rounded-2xl border-white/10 bg-white/6 text-white placeholder:text-slate-500"
                />
              </div>

              {feedback ? <p className="text-sm text-slate-300">{feedback}</p> : null}

              {resetUrl ? (
                <a href={resetUrl} className="block">
                  <Button type="button" className="h-12 w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600">
                    Redefinir senha agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={loading}
                >
                  {loading ? "Preparando..." : "Enviar instrucoes"}
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

