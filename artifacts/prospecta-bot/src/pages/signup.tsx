import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { getJson, postJson, BASE_URL } from "@/lib/api";
import { AnimatedCharactersGroup } from "@/components/ui/animated-characters-group";

// Icones Google e Apple omitidos para brevidade (vou manter os SVGs do original)
function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.18-1.95H12v3.69h5.39a4.61 4.61 0 0 1-2 3.03v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.29Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.07v2.6A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.88A5.99 5.99 0 0 1 6.1 12c0-.65.11-1.28.31-1.88V7.52H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.48l3.34-2.6Z" />
      <path fill="#EA4335" d="M12 5.99c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.95 2.98 14.7 2 12 2A9.99 9.99 0 0 0 3.07 7.52l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M16.37 12.43c.03 3.24 2.85 4.32 2.88 4.34-.02.08-.45 1.55-1.49 3.07-.89 1.31-1.82 2.62-3.27 2.65-1.42.03-1.88-.84-3.51-.84-1.63 0-2.14.81-3.48.87-1.4.05-2.46-1.4-3.36-2.7-1.84-2.67-3.24-7.53-1.35-10.82.94-1.63 2.62-2.66 4.45-2.69 1.39-.03 2.7.93 3.51.93.81 0 2.33-1.15 3.92-.98.67.03 2.55.27 3.75 2.03-.1.06-2.23 1.3-2.2 4.14ZM14.21 4.86c.75-.91 1.26-2.18 1.12-3.44-1.08.04-2.39.72-3.16 1.63-.69.8-1.29 2.09-1.13 3.32 1.2.09 2.42-.61 3.17-1.51Z" />
    </svg>
  );
}

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false); // Já liberado sem carregar configs chatas
  const [redirectingProvider, setRedirectingProvider] = useState<"google" | "apple" | null>(null);
  const queryState = useMemo(() => new URLSearchParams(window.location.search), []);
  const referralCode = useMemo(() => {
    const directRef = queryState.get("ref")?.trim();
    if (directRef) {
      try {
        window.localStorage.setItem("contai_ref_code", directRef);
      } catch {}
      return directRef;
    }
    try {
      return window.localStorage.getItem("contai_ref_code")?.trim() || "";
    } catch {
      return "";
    }
  }, [queryState]);

  useEffect(() => {
    const auth = queryState.get("auth");
    const provider = queryState.get("provider");
    if (auth !== "error") return;
    if (provider === "google") {
      setError("Não foi possível concluir o cadastro com Google.");
    }
    if (provider === "apple") {
      setError("Não foi possível concluir o cadastro com Apple.");
    }
  }, [queryState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson("/auth/signup", {
        name,
        email,
        phone,
        password,
        refCode: referralCode || null,
      });
      try { window.localStorage.removeItem("contai_ref_code"); } catch {}
      const cycle = queryState.get("cycle") || "annual";
      navigate(`/assinatura?cycle=${cycle}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível criar sua conta.");
    } finally {
      setSubmitting(false);
    }
  }

  function startSocialSignup(provider: "google" | "apple") {
    setError(null);
    setRedirectingProvider(provider);
    const cycle = queryState.get("cycle") || "annual";
    const params = new URLSearchParams({ 
      source: "signup",
      next: `/assinatura?cycle=${cycle}`
    });
    if (referralCode) {
      params.set("ref", referralCode);
    }
    window.location.href = `${BASE_URL}/api/auth/${provider}/start?${params.toString()}`;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#081512] text-white overflow-x-hidden">
      
      {/* Esquerda: Animação e Branding (Oculto no mobile) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_35%),linear-gradient(135deg,#050f0d_0%,#081512_100%)] p-12">
        <div className="relative z-20 flex justify-between items-center">
          <BrandLogo variant="hero" className="max-w-[150px]" />
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-10 rounded-full border-white/10 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="relative z-20 mx-auto flex h-[500px] w-full max-w-[550px] items-end justify-center">
          <AnimatedCharactersGroup
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={password.length}
          />
        </div>

        <div className="relative z-20 flex items-center gap-6 text-sm text-slate-400">
          <a href="/privacy" className="transition-colors hover:text-white">Privacidade</a>
          <a href="/terms" className="transition-colors hover:text-white">Termos</a>
        </div>
      </div>

      {/* Direita: Formulário Centralizado */}
      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="relative z-10 w-full max-w-[420px]">
          {/* Header Mobile Oculto no LG */}
          <div className="mb-10 flex flex-row items-center justify-between lg:hidden">
            <BrandLogo variant="hero" className="max-w-[140px]" />
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-10 rounded-full border-emerald-500/20 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
            >
              <Link href="/">Voltar</Link>
            </Button>
          </div>

          <div className="mb-10 lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight min-[390px]:text-[2.2rem]">
              Crie sua conta
            </h1>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-400">
              Crie seu acesso agora. Seu bot será ativado após o cadastro.
            </p>
            {referralCode ? (
              <p className="mt-3 text-xs text-emerald-300/80 font-medium bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                ✨ Cadastro com indicação detectada
              </p>
            ) : null}
          </div>



          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="Seu nome completo"
                className="h-13 rounded-2xl border-none bg-[#0c1e19] px-4 text-[15px] text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">E-mail</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="voce@contai.app"
                type="email"
                className="h-13 rounded-2xl border-none bg-[#0c1e19] px-4 text-[15px] text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Telefone do WhatsApp (Bot)</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="(11) 99999-9999"
                type="tel"
                className="h-13 rounded-2xl border-none bg-[#0c1e19] px-4 text-[15px] text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              />
              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                Lembre-se: Use o número que enviará as mensagens para o bot.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">Senha</label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder="Crie uma senha"
                  className="h-13 rounded-2xl border-none bg-[#0c1e19] px-4 pr-12 text-[15px] text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                />
                <div 
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 cursor-pointer hover:text-emerald-400 transition-colors px-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[13px] font-medium text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-6 h-13 w-full rounded-2xl bg-emerald-500 px-8 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] disabled:opacity-70"
            >
              {submitting ? "Criando conta..." : "Criar conta e continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="mt-8 text-center text-[13px] font-medium text-slate-400">
              Já tem conta?{" "}
              <Link href="/login" className="text-emerald-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
