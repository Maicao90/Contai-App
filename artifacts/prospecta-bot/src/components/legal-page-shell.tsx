import { type ReactNode, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { GradientDots } from "@/components/ui/gradient-dots";

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Contai`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050b12] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.14),transparent_18%),linear-gradient(180deg,#03070d_0%,#07101a_45%,#04070c_100%)]" />
        <GradientDots
          dotSize={6}
          spacing={14}
          duration={40}
          colorCycleDuration={12}
          className="opacity-[0.16] [mask-image:radial-gradient(circle_at_center,black_18%,black_66%,transparent_94%)]"
        />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo variant="sidebar" />
          <Link href="/">
            <a className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-300/25 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a landing
            </a>
          </Link>
        </header>

        <main className="mt-8 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,17,0.9)_0%,rgba(7,13,20,0.94)_100%)] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-10 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
            Contai
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-200 sm:text-base">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
