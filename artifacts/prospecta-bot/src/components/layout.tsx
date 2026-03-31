import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageCircleMore,
  Settings,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

const navItems = [
  { name: "Visão Geral", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transacoes", icon: Wallet },
  { name: "Agenda", href: "/agenda", icon: CalendarClock },
  { name: "Conversas", href: "/conversas", icon: MessageCircleMore },
  { name: "Assinatura", href: "/assinatura", icon: CreditCard },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === href : location.startsWith(href);

  const sidebar = (
    <>
      <div className="px-6 py-7">
        <BrandLogo variant="sidebar" className="max-w-[220px]" />
      </div>

      <nav className="space-y-1 px-4 pb-6">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
            <div
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive(item.href)
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-slate-950",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </div>
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbf8_0%,#eef6f1_100%)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-emerald-100 bg-white/85 backdrop-blur xl:block">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-emerald-100 bg-white/85 px-4 py-4 backdrop-blur xl:hidden">
        <BrandLogo variant="mobile" />
        <button
          className="rounded-2xl border border-emerald-100 p-2 text-slate-700"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <button
              className="absolute right-4 top-4 rounded-full border border-emerald-100 p-2"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="xl:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
