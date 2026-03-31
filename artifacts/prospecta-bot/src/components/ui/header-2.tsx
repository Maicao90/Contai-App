import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";

type HeaderLink = {
  label: string;
  href: string;
};

type HeaderProps = {
  links?: HeaderLink[];
  primaryHref?: string;
};

const defaultLinks: HeaderLink[] = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Preço", href: "#preco" },
];

export function Header({ links = defaultLinks, primaryHref = "/cadastro" }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-6xl border-b border-transparent transition-all ease-out sm:px-4",
        {
          "border-white/10 bg-[#07111a]/82 shadow-[0_14px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:top-3 sm:rounded-full":
            scrolled && !open,
          "bg-[#07111a] shadow-[0_20px_60px_rgba(0,0,0,0.32)] sm:rounded-[28px]":
            open,
        },
      )}
    >
      <nav
        className={cn(
          "mx-auto flex h-[55px] w-full items-center justify-between px-3 sm:px-5 lg:px-6",
          {
            "sm:px-4": scrolled,
          },
        )}
      >
        <a
          href="/"
          className="w-[96px] overflow-hidden sm:w-[132px]"
          aria-label="Voltar para a Home"
        >
          <img
            src="/contai-logo-dark.png"
            alt="Contai"
            className="block h-auto w-[112%] max-w-none -mb-[12%] -ml-[6%] -mt-[7%]"
          />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              className={buttonVariants({
                variant: "ghost",
                className: "rounded-full px-4 text-sm text-slate-300 hover:text-white",
              })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/12 bg-white/5 px-4 text-slate-200 hover:bg-white/10"
          >
            <a href="/login">Entrar</a>
          </Button>
          <Button
            asChild
            className="rounded-full bg-emerald-500 px-5 text-white shadow-[0_12px_30px_rgba(16,185,129,0.24)] hover:bg-emerald-400"
          >
            <a href={primaryHref}>Começar agora</a>
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen((current) => !current)}
          className="rounded-full border-white/12 bg-white/5 text-white hover:bg-white/10 md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-[55px] z-[70] border-y border-white/10 bg-[#07111a] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#07111a_0%,#061019_100%)]" />
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute inset-x-8 top-10 h-28 rounded-full bg-emerald-400/8 blur-3xl" />

        <div
          data-slot={open ? "open" : "closed"}
          className={cn(
            "relative flex h-full w-full flex-col justify-between gap-y-4 p-4 ease-out data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 data-[slot=open]:animate-in data-[slot=open]:zoom-in-95",
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: "ghost",
                  className:
                    "justify-start rounded-2xl px-4 py-3 text-base text-slate-200 hover:bg-white/6 hover:text-white",
                })}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-2xl border-white/12 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              <a href="/login" onClick={() => setOpen(false)}>
                Entrar
              </a>
            </Button>
            <Button
              asChild
              className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <a href={primaryHref} onClick={() => setOpen(false)}>
                Começar agora
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
