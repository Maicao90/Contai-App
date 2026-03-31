import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { BrandLogo } from "@/components/brand-logo";
import { GradientDots } from "@/components/ui/gradient-dots";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ShellLayoutProps = {
  area: "app" | "admin";
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export function ShellLayout({
  area,
  title,
  subtitle,
  navItems,
  children,
}: ShellLayoutProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  useTheme();

  const isActive = (href: string) =>
    href === `/${area}/dashboard` ? location === href : location.startsWith(href);

  const sidebar = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-emerald-100/80 px-4 pb-4 pt-3 lg:px-5 lg:pb-5 lg:pt-4 xl:px-6">
          <div className="px-3 xl:px-2">
            <BrandLogo variant="sidebar" />
          </div>

          <div className="mt-3 rounded-[24px] border border-slate-200/70 bg-slate-950/92 px-4 py-4 text-white shadow-[0_14px_40px_rgba(2,6,23,0.12)] xl:mt-4 xl:rounded-[28px] xl:px-5 xl:py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/90">
              {area === "admin" ? "Operacao interna" : "Area do cliente"}
            </p>
            <p className="mt-2 text-balance text-base font-semibold leading-tight text-white xl:text-[17px]">
              {title}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-300/88 xl:leading-6">{subtitle}</p>
          </div>
        </div>

        <nav className="space-y-1.5 px-3 py-4 lg:px-4 xl:px-5 xl:py-6">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
              <div
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition xl:py-3.5 xl:text-[15px]",
                  isActive(item.href)
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-slate-950",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="min-w-0 break-words">{item.name}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-slate-200/80 px-4 py-4 lg:px-5 xl:px-6 xl:py-5">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5">
          <div>
            <p className="break-words text-sm font-semibold text-slate-900">{session?.name ?? "Sessao"}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{session?.role ?? "visitante"}</p>
          </div>
          <button
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 xl:inline-flex"
            onClick={() => void logout()}
          >
            {area === "admin" ? <ShieldCheck className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            Sair da conta
          </button>
          <div className="mt-3 flex items-center justify-end xl:hidden">
            <button
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
              onClick={() => void logout()}
            >
              {area === "admin" ? <ShieldCheck className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="theme-shell relative min-h-screen overflow-x-clip text-slate-950 xl:grid xl:grid-cols-[18.75rem_minmax(0,1fr)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <GradientDots
          dotSize={6}
          spacing={14}
          duration={40}
          colorCycleDuration={12}
          className="opacity-[0.08] [mask-image:radial-gradient(circle_at_center,black_12%,transparent_82%)]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(34,211,238,0.06),transparent_20%)]" />
      </div>
      <aside className="theme-sidebar hidden h-screen border-r border-emerald-100/80 backdrop-blur xl:sticky xl:top-0 xl:flex xl:flex-col">
        {sidebar}
      </aside>

      <header className="theme-topbar sticky top-0 z-30 flex items-center justify-between border-b border-emerald-100 px-3 py-2.5 backdrop-blur xl:hidden">
        <BrandLogo variant="mobile" />
        <div className="flex items-center gap-2">
          <button
            className="rounded-2xl border border-emerald-100 p-2.5 text-slate-700"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
          <aside className="theme-sidebar absolute left-0 top-0 flex h-full w-[min(92vw,22rem)] flex-col overflow-hidden shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-end border-b border-emerald-100/70 bg-[rgba(6,18,16,0.96)] px-4 py-3 backdrop-blur">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
                Fechar menu
              </button>
            </div>
            {sidebar}
            <div className="border-t border-emerald-100/70 px-4 py-4">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
                Voltar ao painel
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="min-w-0 overflow-x-hidden">
        <div className="w-full min-w-0 px-3 py-4 sm:px-4 md:px-6 md:py-6 xl:px-8 xl:py-8 2xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
