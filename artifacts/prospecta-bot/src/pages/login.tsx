import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { AnimatedCharactersGroup } from "@/components/ui/animated-characters-group";

type SocialProvidersResponse = {
  google: { configured: boolean };
  apple: { configured: boolean };
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.18-1.95H12v3.69h5.39a4.61 4.61 0 0 1-2 3.03v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.29Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.07v2.6A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.88A5.99 5.99 0 0 1 6.1 12c0-.65.11-1.28.31-1.88V7.52H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.48l3.34-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.99c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.95 2.98 14.7 2 12 2A9.99 9.99 0 0 0 3.07 7.52l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z"
      />
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

export default function LoginPage() {
  const { session, login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialProviders, setSocialProviders] = useState<SocialProvidersResponse>({
    google: { configured: false },
    apple: { configured: false },
  });
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [redirectingProvider, setRedirectingProvider] = useState<"google" | "apple" | null>(null);

  const queryState = useMemo(() => new URLSearchParams(window.location.search), []);
  const nextPath = queryState.get("next");

  useEffect(() => {
    if (!session) return;
    if (nextPath && session.role !== "admin") {
      navigate(nextPath);
      return;
    }
    navigate(session.role === "admin" ? "/admin/dashboard" : "/app/dashboard");
  }, [navigate, nextPath, session]);

  useEffect(() => {
    const auth = queryState.get("auth");
    const provider = queryState.get("provider");

    if (auth === "error") {
      if (provider === "google") {
        setError("Nao foi possivel concluir o login com Google.");
      } else if (provider === "apple") {
        setError("Nao foi possivel concluir o login com Apple.");
      }
    }
  }, [queryState]);

  useEffect(() => {
    let cancelled = false;

    void getJson<SocialProvidersResponse>("/auth/providers")
      .then((data) => {
        if (!cancelled) {
          setSocialProviders(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Nao foi possivel carregar o status do login social.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProviders(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFormLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await login(identifier, password);
      if (nextPath) {
        navigate(nextPath);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Nao foi possivel entrar.");
    }
  }

  function startSocialLogin(provider: "google" | "apple") {
    setError(null);

    setRedirectingProvider(provider);
    const params = new URLSearchParams({ source: "login" });
    if (nextPath) {
      params.set("next", nextPath);
    }
    window.location.href = `/api/auth/${provider}/start?${params.toString()}`;
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
          <a href="#" className="transition-colors hover:text-white">
            Privacidade
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Termos
          </a>
          <a href="#" className="transition-colors hover:text-white">
            Contato
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-emerald-500/10 mix-blend-screen blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-cyan-500/5 mix-blend-screen blur-[100px]" />
      </div>

      {/* Direita: Formulário de Login */}
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

          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
              Acesso
            </p>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">
              Acesse sua conta
            </h1>
            <p className="text-sm text-slate-400">Entre com seus dados ou use acesso social.</p>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-center rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => startSocialLogin("google")}
              disabled={loadingProviders || redirectingProvider !== null}
            >
              <GoogleIcon />
              {redirectingProvider === "google" ? "Abrindo..." : "Entrar com Google"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-center rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => startSocialLogin("apple")}
              disabled={loadingProviders || redirectingProvider !== null}
            >
              <AppleIcon />
              {redirectingProvider === "apple" ? "Abrindo..." : "Entrar com Apple"}
            </Button>
          </div>

          <p className="text-center text-xs text-emerald-500/80 font-medium mb-5">
            {loadingProviders
              ? "Preparando conexões seguras..."
              : "Login social 100% seguro."}
          </p>

          <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-600">
            <div className="h-px flex-1 bg-white/5" />
            ou continue com senha
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">E-mail ou telefone</label>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="voce@contai.app ou (21) 99999-9999"
                className="h-12 rounded-2xl border-white/10 bg-white/4 text-white placeholder:text-slate-600 focus-visible:border-emerald-500"
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">Senha</label>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="h-12 rounded-2xl border-white/10 bg-white/4 pr-11 text-white placeholder:text-slate-600 focus-visible:border-emerald-500"
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
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
              <div className="rounded-xl border border-red-900/30 bg-red-950/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="h-12 w-full rounded-2xl bg-emerald-500 px-5 text-base text-white shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:bg-emerald-600"
              >
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl border-white/10 bg-transparent text-base text-white hover:bg-white/5"
              >
                <Link href="/cadastro">Cadastre-se</Link>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link href="/esqueci-senha">
                <button
                  type="button"
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-300"
                >
                  Esqueci minha senha
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
