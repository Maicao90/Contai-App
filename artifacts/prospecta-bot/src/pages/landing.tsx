import { type ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  AlarmClock,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Link2,
  MessageCircleMore,
  PanelsTopLeft,
  ReceiptText,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
  Zap,
  Shield,
  Target,
  Repeat,
  Calendar,
} from "lucide-react";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { HeroFuturistic } from "@/components/ui/hero-futuristic";
import {
  AnimatedWords,
  DigitalSerenityTextStyles,
} from "@/components/ui/digital-serenity-animated-landing-page";
import { FeatureGrid } from "@/components/ui/features-2";
import { Component as EtheralShadow } from "@/components/ui/etheral-shadow";
import { GradientDots } from "@/components/ui/gradient-dots";
import { Header } from "@/components/ui/header-2";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import * as PricingCard from "@/components/ui/pricing-card";
import { TechnologyAuthoritySection } from "@/components/technology-authority-section";

const chatMessages = [
  { from: "user", text: "gastei 200 no mercado" },
  {
    from: "bot",
    text:
      "Anotei os R$ 200,00 que você gastou com mercado hoje, Maicon. Tudo já está organizado para você.\n\n📋 Resumo da transação:\n🧾 Descrição: Mercado\n💸 Valor: R$ 200,00\n📂 Categoria: Mercado\n📅 Data: 30/03/2026\n✅ Status: Pago\n👤 Tipo: Pessoal\n💳 Pagamento: Pix\n\n💰 Saldo anterior: R$ 3.000,00\n💸 Valor descontado: R$ 200,00\n✅ Seu saldo pessoal atual: R$ 2.800,00",
  },
  { from: "user", text: "Registra 500 entrada da casa" },
  {
    from: "bot",
    text:
      "Anotei os R$ 500,00 que você recebeu de Entrada hoje, Maicon. Tudo já está organizado para você.\n\n📋 Resumo da transação:\n🧾 Descrição: Entrada\n💰 Valor: R$ 500,00\n📂 Categoria: Freela\n📅 Data: 30/03/2026\n✅ Status: Recebido\n🏠 Tipo: Gasto da casa\n💳 Pagamento: Pix\n\n💰 Seu saldo na casa antes: R$ 1.000,00\n💰 Seu ganho na casa: R$ 500,00\n✅ Seu saldo na casa agora: R$ 1.500,00\n\n👥 Saldo total da casa agora: R$ 2.500,00",
  },
];
const steps = [
  {
    icon: MessageCircleMore,
    step: "01",
    title: "Você manda mensagem",
    description: "Tudo começa no WhatsApp, do jeito que você já fala no dia a dia, sem abrir planilha nem aprender fluxo novo.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "O Contai entende e organiza",
    description: "O que você escreve vira gasto, conta, compromisso ou lembrete organizado de forma clara e automática.",
  },
  {
    icon: PanelsTopLeft,
    step: "03",
    title: "Você acompanha tudo",
    description: "Você recebe confirmações no WhatsApp e usa o painel ou o Google Agenda só quando quiser aprofundar.",
  },
];

const benefits = [
  { icon: Wallet, title: "Mais clareza no dia a dia", description: "Você entende melhor o que entrou, o que saiu e o que precisa acontecer, sem tirar tempo da rotina." },
  { icon: AlarmClock, title: "Menos esquecimento", description: "Contas, vencimentos e compromissos deixam de depender só da memória ou de vários lembretes espalhados." },
  { icon: CalendarDays, title: "Rotina mais leve", description: "Dinheiro e agenda passam a andar juntos a partir da mesma conversa, no mesmo fluxo." },
  { icon: CircleDollarSign, title: "Constância sem esforço", description: "Fica mais fácil manter a organização quando tudo começa no WhatsApp, em vez de exigir disciplina extra." },
  { icon: MessageCircleMore, title: "Do seu jeito", description: "Você usa linguagem natural, como já usa no WhatsApp, sem termos técnicos nem telas complicadas." },
  { icon: Smartphone, title: "Pensado para a vida real", description: "Funciona no celular, no ritmo do dia e sem pedir que você pare tudo para se organizar." },
];

const features = [
  { icon: Wallet, title: "Gastos", description: "Anote despesas em segundos." },
  { icon: CircleDollarSign, title: "Receitas", description: "Registre entradas e recebimentos." },
  { icon: ReceiptText, title: "Contas a pagar", description: "Controle vencimentos sem esquecer." },
  { icon: Link2, title: "Contas a receber", description: "Acompanhe o que ainda precisa entrar." },
  { icon: CalendarDays, title: "Compromissos", description: "Salve consultas, reuniões e eventos." },
  { icon: AlarmClock, title: "Lembretes", description: "Receba ajuda para não deixar nada passar." },
  { icon: Wallet, title: "Saldos Multi-Nível", description: "Veja seu saldo pessoal, seu saldo na casa e o total da casa separadamente." },
  { icon: Target, title: "Metas e Alertas", description: "Receba avisos instantâneos quando atingir 80% do uso do saldo da casa." },
  { icon: Shield, title: "Privacidade Real", description: "Seus gastos pessoais são 100% invisíveis para os outros membros da casa." },
  { icon: Clock3, title: "Agenda", description: "Veja o dia e a semana com clareza." },
  { icon: LayoutDashboard, title: "Painel web", description: "Mais controle quando você quiser aprofundar." },
  { icon: Link2, title: "Google Agenda", description: "Sincronize compromissos quando fizer sentido." },
];

const quickProof = [
  { label: "WhatsApp como centro", value: "Tudo começa na conversa" },
  { label: "Conta compartilhada", value: "Até 2 membros por conta" },
  { label: "Agenda sincronizada", value: "Google Agenda integrado" },
  { label: "Plano Contai", value: "Anual em destaque" },
];

const faqs = [
  { question: "Como funciona no WhatsApp?", answer: "Você manda mensagens simples, como já manda no dia a dia. O Contai interpreta, registra e responde de forma curta e clara." },
  { question: "Posso usar sozinho?", answer: "Sim. A conta pode ser individual ou compartilhada com mais uma pessoa." },
  { question: "Posso compartilhar com outra pessoa?", answer: "Sim. O Plano Contai permite até 2 membros por conta, ideal para casal ou parceria." },
  { question: "O Contai substitui planilhas?", answer: "Essa é justamente a proposta. Você organiza a vida por conversa, com muito menos atrito." },
  { question: "O Google Agenda integra?", answer: "Sim. A integração pode ser conectada para sincronizar compromissos e manter sua agenda alinhada." },
  { question: "Quanto custa?", answer: "O Plano Contai pode ser pago em duas formas: R$14,90 por mês ou R$99,90 por ano, com os mesmos recursos." },
];

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80 sm:text-[11px] sm:tracking-[0.28em]">{eyebrow}</p>
      <h2 className="mt-2.5 text-[1.85rem] font-semibold leading-[1.06] tracking-tight text-white sm:mt-3 sm:text-4xl">{title}</h2>
      <p className="mt-2.5 text-[0.92rem] leading-7 text-slate-300 sm:mt-3 sm:text-base">{description}</p>
    </div>
  );
}

function SectionDivider() {
  return null;
}

function PhoneMockup() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      className="relative mx-auto w-full max-w-[238px] min-[390px]:max-w-[256px] sm:max-w-[320px] lg:max-w-[280px]"
    >
      <div className="absolute -inset-3 rounded-[36px] bg-emerald-400/10 blur-3xl sm:-inset-6 sm:rounded-[40px]" />
      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 6.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute inset-x-6 top-8 h-24 rounded-full bg-emerald-400/8 blur-3xl sm:inset-x-8 sm:top-10 sm:h-28"
      />
      <div className="relative rounded-[28px] border border-white/10 bg-[#061110]/90 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:rounded-[36px] sm:p-3 sm:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <motion.div
          animate={{ y: ["0%", "100%", "0%"], opacity: [0, 0.35, 0] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-x-4 top-4 h-20 rounded-full bg-gradient-to-b from-emerald-300/0 via-emerald-300/12 to-emerald-300/0 blur-2xl sm:inset-x-5 sm:top-5 sm:h-24"
        />
        <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#0a1118] sm:rounded-[28px] flex items-center justify-center">
          <img src="/contai-screenshot.jpg" alt="Demonstração do Contai" className="h-auto w-full max-w-full object-contain" />
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const primaryHref = "/cadastro?cycle=annual";

  useEffect(() => {
    const previousTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? "";

    document.title = "Contai | Organize seu dinheiro e sua rotina no WhatsApp";
    descriptionTag?.setAttribute(
      "content",
      "Organize gastos, receitas, contas, compromissos e lembretes direto no WhatsApp com o Contai.",
    );

    return () => {
      document.title = previousTitle;
      descriptionTag?.setAttribute("content", previousDescription);
    };
  }, []);

    return (
      <div className="min-h-screen overflow-x-hidden bg-[#050b12] text-white">
        <DigitalSerenityTextStyles />
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(16,185,129,0.24),transparent_20%),radial-gradient(circle_at_88%_14%,rgba(20,184,166,0.2),transparent_22%),radial-gradient(circle_at_50%_55%,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_50%_110%,rgba(52,211,153,0.12),transparent_30%),linear-gradient(180deg,#03070d_0%,#07101a_42%,#04070c_100%)]" />
          <GradientDots
            dotSize={6}
            spacing={14}
            duration={38}
            colorCycleDuration={10}
            className="opacity-[0.14] [mask-image:radial-gradient(circle_at_center,black_22%,black_58%,transparent_92%)] sm:opacity-[0.22]"
          />
          <DottedSurface className="opacity-38 [mask-image:radial-gradient(circle_at_center,black_28%,black_68%,transparent_96%)] sm:opacity-70" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:56px_56px] sm:opacity-[0.3]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(45,212,191,0.7)_0.9px,transparent_0.9px)] [background-position:0_0] [background-size:22px_22px] [mask-image:radial-gradient(circle_at_center,black_24%,black_62%,transparent_92%)] sm:opacity-[0.2]" />
          <div className="absolute inset-0 hidden opacity-[0.18] [background-image:linear-gradient(90deg,transparent_0%,transparent_46%,rgba(16,185,129,0.28)_49%,rgba(16,185,129,0.08)_50%,transparent_54%,transparent_100%),linear-gradient(180deg,transparent_0%,transparent_46%,rgba(45,212,191,0.18)_49%,rgba(45,212,191,0.06)_50%,transparent_54%,transparent_100%)] [background-size:280px_280px] sm:block" />
          <div className="absolute inset-y-0 left-[11%] hidden w-px bg-gradient-to-b from-transparent via-emerald-300/34 to-transparent sm:block" />
          <div className="absolute inset-y-0 left-[49%] hidden w-px bg-gradient-to-b from-transparent via-slate-200/12 to-transparent sm:block" />
          <div className="absolute inset-y-0 right-[14%] hidden w-px bg-gradient-to-b from-transparent via-teal-300/28 to-transparent sm:block" />
          <div className="absolute inset-x-[8%] top-[12%] hidden h-px bg-gradient-to-r from-transparent via-emerald-200/18 to-transparent sm:block" />
          <div className="absolute inset-x-[12%] bottom-[18%] hidden h-px bg-gradient-to-r from-transparent via-teal-200/14 to-transparent sm:block" />
          <div className="absolute left-[8%] top-[10%] h-40 w-40 rounded-full bg-emerald-400/12 blur-3xl sm:h-56 sm:w-56 sm:bg-emerald-400/14" />
          <div className="absolute left-[62%] top-[22%] hidden h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl sm:block" />
          <div className="absolute bottom-[8%] right-[10%] h-56 w-56 rounded-full bg-teal-400/10 blur-3xl sm:h-72 sm:w-72 sm:bg-teal-400/14" />
          <div className="absolute bottom-[22%] left-[16%] hidden h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl sm:block" />
          <motion.div
            animate={{ x: ["0%", "8%", "0%"], opacity: [0.12, 0.24, 0.12] }}
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-[6%] top-[24%] hidden h-px w-[28%] bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent sm:block"
          />
          <motion.div
            animate={{ x: ["0%", "-8%", "0%"], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute right-[6%] top-[38%] hidden h-px w-[24%] bg-gradient-to-r from-transparent via-teal-300/45 to-transparent sm:block"
          />
          <motion.div
            animate={{ y: ["0%", "10%", "0%"], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-[22%] top-[12%] hidden h-[26%] w-px bg-gradient-to-b from-transparent via-emerald-300/45 to-transparent sm:block"
          />
          <motion.div
            animate={{ x: ["-8%", "10%", "-8%"], opacity: [0.08, 0.16, 0.08] }}
            transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute left-1/2 top-[18%] h-52 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-400/18 blur-3xl"
          />
          <motion.div
            animate={{ y: ["-12%", "10%", "-12%"], opacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute right-[8%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-teal-300/14 blur-3xl"
          />
          <motion.div
            animate={{ x: ["-3%", "4%", "-3%"] }}
            transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute inset-x-0 top-[8%] h-24 bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(16,185,129,0))] blur-2xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(5,11,18,0.42)_76%,rgba(5,11,18,0.9)_100%)]" />
        </div>

      <div className="px-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-3 sm:pt-3">
        <Header primaryHref={primaryHref} />
      </div>

        <main>
        <section className="px-4 pb-5 pt-6 sm:px-6 sm:pb-10 sm:pt-14 lg:px-8 lg:pb-12 lg:pt-18">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="relative mx-auto max-w-4xl text-center">
                <motion.div
                  animate={{ opacity: [0.2, 0.34, 0.2], scale: [0.97, 1.04, 0.97] }}
                  transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="pointer-events-none absolute left-1/2 top-12 h-28 w-52 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl sm:top-16 sm:h-36 sm:w-72"
                />
                <h1 className="mx-auto max-w-[22rem] text-balance text-[2.02rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white min-[390px]:max-w-[24rem] min-[390px]:text-[2.18rem] sm:max-w-none sm:text-[3.55rem] lg:text-[4.45rem]">
                  <AnimatedWords
                    as="span"
                    text="Seu dinheiro organizado"
                    baseDelay={120}
                    className="block"
                  />
                  <AnimatedWords
                    as="span"
                    text="direto no WhatsApp"
                    baseDelay={520}
                    className="block"
                  />
                </h1>
                <p className="mx-auto mt-5 max-w-[19.25rem] text-balance text-[12px] leading-[1.72] text-slate-300 min-[390px]:max-w-[20.5rem] min-[390px]:text-[12.5px] sm:mt-6 sm:max-w-[50rem] sm:text-[1.05rem] sm:leading-8">
                  <span className="sm:hidden">
                    <AnimatedWords
                      as="span"
                      text="Sem planilha. Sem complicação. Sem dor de cabeça."
                      baseDelay={940}
                      className="block font-semibold leading-[1.55] text-white"
                    />
                    <AnimatedWords
                      as="span"
                      text="Com o Contai, você organiza gastos, contas e compromissos direto no WhatsApp."
                      baseDelay={1320}
                      className="mt-2 block"
                    />
                  </span>
                  <span className="hidden sm:inline">
                    <AnimatedWords
                      as="span"
                      text="Sem planilha. Sem complicação. Sem dor de cabeça."
                      baseDelay={940}
                      className="font-semibold text-white"
                    />{" "}
                    <AnimatedWords
                      as="span"
                      text="Com o Contai, você organiza gastos, contas e compromissos direto no WhatsApp. Tudo simples, prático e no seu ritmo."
                      baseDelay={1360}
                    />
                  </span>
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                  <Button asChild className="h-11.5 w-full rounded-full bg-emerald-500 px-6 text-[1rem] text-white shadow-[0_14px_40px_rgba(16,185,129,0.28)] hover:bg-emerald-400 min-[390px]:h-12 sm:h-12 sm:w-auto sm:text-base">
                    <a href={primaryHref}>
                      <AnimatedWords as="span" text="Começar agora" baseDelay={1900} />
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("como-funciona")}
                    className="inline-flex h-11.5 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 text-[1rem] text-white transition hover:bg-white/10 min-[390px]:h-12 sm:h-12 sm:w-auto sm:text-base"
                  >
                    <AnimatedWords as="span" text="Ver como funciona" baseDelay={2140} />
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="overflow-hidden rounded-[24px] border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(9,44,38,0.98)_0%,rgba(7,31,28,0.98)_100%)] shadow-[0_24px_80px_rgba(6,95,70,0.28)] sm:rounded-[32px]">
              <div className="grid grid-cols-2 md:grid-cols-4">
                {quickProof.map((item, index) => (
                  <Reveal key={item.label} delay={index * 0.06}>
                    <motion.div
                      animate={{ y: [0, -1.5, 0] }}
                      transition={{ duration: 5 + index, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="relative flex h-full items-center justify-center px-3 py-5 text-center min-[390px]:px-4 min-[390px]:py-6 sm:px-6 sm:py-7"
                    >
                      {index < quickProof.length - 1 ? (
                        <div className="pointer-events-none absolute inset-y-5 right-0 hidden w-px bg-emerald-100/16 md:block" />
                      ) : null}
                      {index < 2 ? <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-emerald-100/12 md:hidden" /> : null}
                      {index % 2 === 0 ? <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-emerald-100/12 md:hidden" /> : null}
                      <div className="mx-auto flex max-w-[135px] flex-col items-center justify-center min-[390px]:max-w-[152px] sm:max-w-[280px]">
                        <p className="text-balance text-[0.94rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white min-[390px]:text-[1rem] sm:text-[1.5rem] sm:leading-[1.05] lg:whitespace-nowrap">
                          {item.value}
                        </p>
                        <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-100/70 min-[390px]:tracking-[0.16em] sm:mt-3 sm:text-[11px] sm:tracking-[0.22em]">
                          {item.label}
                        </p>
                      </div>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <TechnologyAuthoritySection />
        <section id="como-funciona" className="bg-[linear-gradient(180deg,rgba(7,18,17,0.5)_0%,rgba(5,11,18,0)_100%)] px-4 py-9 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <SectionDivider />
            <Reveal>
              <SectionHeader
                eyebrow="Como funciona"
                title="Do WhatsApp para a sua vida organizada"
                description="O WhatsApp é o ponto de partida. O Contai organiza no fundo e o painel entra só como apoio quando você quiser mais detalhe."
              />
            </Reveal>
            <Reveal delay={0.05} className="mt-7 md:mt-10">
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,28,0.92)_0%,rgba(10,16,24,0.96)_100%)] p-3.5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:rounded-[34px] sm:p-6 lg:p-8">
                <div className="space-y-3.5 sm:space-y-5">
                  {steps.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="relative grid gap-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4 sm:grid-cols-[76px_minmax(0,1fr)] sm:items-start sm:gap-5 sm:rounded-[24px] sm:p-5 lg:grid-cols-[92px_minmax(0,680px)_auto] lg:items-center lg:gap-8 lg:px-6 lg:py-6"
                      >
                        <div className="flex items-center gap-3 sm:block lg:self-stretch">
                          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-[#152129] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:h-[60px] sm:w-[60px] sm:rounded-[22px]">
                            <Icon className="h-5 w-5 text-emerald-300 sm:h-6 sm:w-6" />
                          </div>
                          <div className="sm:mt-3 lg:flex lg:h-[calc(100%-60px)] lg:flex-col lg:justify-end">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                              Etapa {item.step}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 lg:max-w-[42rem]">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 lg:block">
                            <h3 className="max-w-[16ch] text-balance text-[1.02rem] font-semibold leading-[1.13] tracking-[-0.03em] text-white min-[390px]:max-w-[18ch] sm:max-w-none sm:text-[1.4rem] sm:leading-[1.08] lg:max-w-[26ch] lg:text-[1.65rem] lg:leading-[1.06]">
                              {item.title}
                            </h3>
                            <div className="hidden shrink-0 rounded-full border border-emerald-300/16 bg-emerald-400/8 px-3 py-1 text-[11px] font-medium text-emerald-100/90 sm:block lg:hidden">
                              {index === 0 ? "Mensagem" : index === 1 ? "Organização" : "Acompanhamento"}
                            </div>
                          </div>
                          <p className="mt-2 max-w-[34ch] text-pretty text-[0.87rem] leading-[1.78] text-slate-300 min-[390px]:max-w-[38ch] sm:mt-3 sm:text-[1rem] sm:leading-8 lg:mt-3.5 lg:max-w-[33rem] lg:text-[1.02rem] lg:leading-8">
                            {item.description}
                          </p>
                        </div>

                        <div className="hidden lg:flex lg:justify-end">
                          <div className="shrink-0 rounded-full border border-emerald-300/16 bg-emerald-400/8 px-4 py-1.5 text-[12px] font-medium text-emerald-100/90">
                            {index === 0 ? "Mensagem" : index === 1 ? "Organização" : "Acompanhamento"}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>


        {/* SESSÃO HERÓI: Cérebro IA (Substituiu os antigos Benefícios) */}
        <section id="beneficios" className="px-4 py-9 sm:px-6 sm:py-16 lg:px-8 lg:py-20 relative">
          <div className="mx-auto max-w-7xl relative z-10">
            <SectionDivider />
            
            <div className="mt-8 md:mt-12">
              <Reveal>
                <HeroFuturistic />
              </Reveal>
            </div>
            
            {/* Elegant feature list below the hero futuristic */}
            <Reveal delay={0.15} className="mt-8 sm:mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
                {[
                  { title: "Sempre Ativo", text: "24 horas por dia pronto para ouvir seus gastos pelo WhatsApp.", icon: Zap },
                  { title: "Visão Clara", text: "Dashboard limpo que mostra exatamente para onde seu dinheiro vai.", icon: LayoutDashboard },
                  { title: "Segurança Total", text: "Organização estruturada de dados na nuvem, sem risco de perder planilhas.", icon: Shield },
                  { title: "Metas e Alertas", text: "Receba avisos instantâneos quando estiver gastando fora do que planejou.", icon: Target },
                  { title: "Rotina Automática", text: "Contas fixas e rotineiras lançadas sozinhas. Você foca no que importa.", icon: Repeat },
                  { title: "Sincronização", text: "Vínculo nativo com seu Google Calendar para pagar boletos no dia certo.", icon: Calendar }
                ].map((ft, idx) => (
                  <div key={idx} className="group relative flex gap-4 p-5 rounded-3xl border border-emerald-400/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.03)_0%,rgba(6,10,18,0.6)_100%)] shadow-2xl backdrop-blur-md transition-all hover:bg-emerald-500/5 hover:-translate-y-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#091E16] text-emerald-400 border border-emerald-400/20 shadow-[0_4px_20px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
                      <ft.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 text-[1rem] tracking-tight">{ft.title}</h4>
                      <p className="mt-1.5 text-[0.85rem] text-slate-400/90 leading-relaxed max-w-[28ch]">{ft.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>



        <section className="px-4 py-12 sm:px-6 sm:py-20 lg:px-8 bg-emerald-500/5">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <Reveal>
                <div className="relative aspect-square max-w-md mx-auto lg:mx-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-[40px] blur-3xl animate-pulse" />
                  <div className="relative h-full w-full rounded-[40px] border border-white/10 bg-[#0a151f] p-8 flex flex-col justify-center shadow-2xl">
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-400">Saldo Pessoal</span>
                          <Shield className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-semibold text-white">R$ 3.450,00</p>
                        <p className="text-[10px] text-emerald-400 mt-1">🔒 Apenas você vê este valor</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-400">Saldo na Casa</span>
                          <Users className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p className="text-2xl font-semibold text-white">R$ 1.200,00</p>
                        <p className="text-[10px] text-slate-400 mt-1">Sua contribuição para as despesas comuns</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="space-y-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Privacidade Garantida</p>
                  <h2 className="text-3xl font-semibold text-white sm:text-4xl">Suas finanças pessoais são sagradas.</h2>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    O Contai foi desenhado com um muro digital entre o que é seu e o que é da casa. 
                    Registre seus gastos pessoais com Pix ou Crédito e tenha certeza: <b>ninguém na casa terá acesso a esses dados.</b>
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Isolamento total de saldos pessoais",
                      "Visualização clara do 'seu' dinheiro vs 'nosso' dinheiro",
                      "Alertas de uso específicos para as contas da casa",
                      "Histórico de transações privadas criptografado"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-200">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="text-center mb-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Alertas Inteligentes</p>
                <h2 className="text-3xl font-semibold text-white mt-4 sm:text-4xl">O robô que cuida do seu limite por você.</h2>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { 
                  title: "Alerta de 80%", 
                  desc: "Mantenha a saúde financeira. O Contai avisa assim que a conta da casa atingir 80% do uso previsto.",
                  icon: Zap,
                  color: "border-yellow-500/20 bg-yellow-500/5 text-yellow-200"
                },
                { 
                  title: "Aviso de Saldo Crítico", 
                  desc: "Nunca seja pego de surpresa. Receba notificações automáticas quando o saldo estiver próximo de zerar.",
                  icon: Target,
                  color: "border-orange-500/20 bg-orange-500/5 text-orange-200"
                },
                { 
                  title: "Gestão Proativa", 
                  desc: "Se o saldo da casa ficar negativo, o bot te alerta em qualquer interação para que você possa agir rápido.",
                  icon: Shield,
                  color: "border-red-500/20 bg-red-500/5 text-red-100"
                }
              ].map((alert, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <div className={`p-6 rounded-3xl border ${alert.color} h-full`}>
                    <alert.icon className="h-8 w-8 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{alert.title}</h3>
                    <p className="text-sm opacity-80 leading-relaxed">{alert.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>



        <section id="preco" className="bg-[linear-gradient(180deg,rgba(7,24,22,0.36)_0%,rgba(5,11,18,0)_100%)] px-4 py-9 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionDivider />
            <Reveal>
                <div className="rounded-[28px] border border-emerald-300/14 bg-[linear-gradient(180deg,rgba(8,25,23,0.96)_0%,rgba(7,17,16,0.96)_100%)] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[34px] sm:p-8 lg:p-10">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Preço claro</p>
                    <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Um plano simples para entrar do jeito que fizer mais sentido.</h2>
                    <p className="mt-4 max-w-2xl text-[0.95rem] leading-[1.6] text-slate-300 sm:text-base sm:leading-7">
                      <span className="sm:hidden">
                        Acesso total liberado. Vá de mensal pela flexibilidade ou garanta o anual com desconto.
                      </span>
                      <span className="hidden sm:inline">
                        O Plano Contai entrega os mesmos recursos nas duas opções. Você pode começar no mensal com mais flexibilidade ou escolher o anual para economizar mais e já ficar coberto o ano inteiro.
                      </span>
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                      {[
                        "100% via WhatsApp",
                        "Painel Web completo",
                        "Avisos automáticos",
                        "Até 2 pessoas",
                        "Sincroniza Google",
                      ].map((item) => (
                        <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-100 sm:border-white/10 sm:bg-white/6 sm:px-4 sm:py-2 sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal sm:text-slate-100">
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-sm text-slate-300">Mensal</p>
                        <p className="mt-2 text-3xl font-semibold text-white">R$14,90</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">Ideal para começar com mais liberdade, sem mudar nada no produto.</p>
                        <a href="/cadastro?cycle=monthly" className="mt-4 inline-flex text-sm font-medium text-slate-200 transition hover:text-white">
                          Escolher mensal
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                      <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-400/8 p-5">
                        <p className="text-sm text-emerald-300">Melhor escolha</p>
                        <p className="mt-2 text-3xl font-semibold text-white">R$99,90</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">A melhor escolha para pagar menos no ano e usar o Contai com mais tranquilidade.</p>
                        <a href={primaryHref} className="mt-4 inline-flex text-sm font-medium text-emerald-200 transition hover:text-white">
                          Escolher anual
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                    <PricingCard.Card className="max-w-none rounded-[28px] border-emerald-300/16 bg-[linear-gradient(180deg,rgba(14,28,27,0.92)_0%,rgba(8,17,16,0.98)_100%)] shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
                      <PricingCard.Header className="mb-3 rounded-[22px] border-emerald-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-5 sm:p-6">
                        <PricingCard.Plan className="mb-7">
                          <PricingCard.PlanName className="text-emerald-100">
                            <Users aria-hidden="true" className="text-emerald-300" />
                            <span>Plano Contai</span>
                          </PricingCard.PlanName>
                          <PricingCard.Badge className="border-emerald-300/20 bg-emerald-400/8 text-emerald-100">
                            Melhor escolha
                          </PricingCard.Badge>
                        </PricingCard.Plan>
                        <PricingCard.Price className="items-end gap-2">
                          <PricingCard.MainPrice className="text-[2.5rem] font-semibold text-white sm:text-5xl">
                            R$99,90
                          </PricingCard.MainPrice>
                          <PricingCard.Period className="pb-2 text-slate-300">/ ano</PricingCard.Period>
                        </PricingCard.Price>
                        <PricingCard.Description className="mb-5 text-sm text-emerald-300">
                          Menos de R$0,30 por dia
                        </PricingCard.Description>
                        <Button asChild className="h-12 w-full rounded-full bg-emerald-500 text-base text-white shadow-[0_14px_40px_rgba(16,185,129,0.25)] hover:bg-emerald-400">
                          <a href={primaryHref}>Assinar anual</a>
                        </Button>
                      </PricingCard.Header>
                      <PricingCard.Body className="space-y-5 p-4 pt-2 sm:p-5 sm:pt-2">
                        <PricingCard.List>
                          {[
                            "Organização direto no WhatsApp",
                            "Conta individual ou compartilhada",
                            "Painel complementar quando precisar",
                            "Agenda, lembretes e compromissos",
                            "Também disponível em R$14,90 por mês",
                          ].map((item) => (
                            <PricingCard.ListItem key={item} className="text-slate-100">
                              <span className="mt-0.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                              </span>
                              <span>{item}</span>
                            </PricingCard.ListItem>
                          ))}
                        </PricingCard.List>
                        <PricingCard.Separator className="text-slate-400">Tudo incluído no plano</PricingCard.Separator>
                        <PricingCard.List>
                          {[
                            "Categorias personalizadas",
                            "Google Agenda integrado",
                            "Histórico organizado",
                          ].map((item) => (
                            <PricingCard.ListItem key={item} className="text-slate-300">
                              <span className="mt-0.5">
                                <Check className="h-4 w-4 text-emerald-300" />
                              </span>
                              <span>{item}</span>
                            </PricingCard.ListItem>
                          ))}
                        </PricingCard.List>
                      </PricingCard.Body>
                    </PricingCard.Card>
                  </div>
                </div>
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-9 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <SectionDivider />
            <Reveal>
              <SectionHeader
                eyebrow="FAQ"
                title="Perguntas frequentes"
                description="Tudo o que uma pessoa precisa entender antes de entrar no Contai, sem enrolação."
              />
            </Reveal>
            <Reveal delay={0.06} className="mt-8 sm:mt-10">
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,24,0.96)_0%,rgba(7,11,18,0.98)_100%)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
                <Accordion type="single" collapsible className="w-full space-y-3">
                  {faqs.map((item, index) => (
                    <AccordionItem
                      key={item.question}
                      value={`item-${index}`}
                      className="overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.03] px-4 sm:px-5"
                    >
                      <AccordionTrigger className="py-5 text-left text-base font-medium text-white hover:no-underline sm:text-lg">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-white/8 pt-4 text-sm leading-7 text-slate-300">
                        <div className="max-w-3xl pb-1">{item.answer}</div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,rgba(7,18,17,0.44)_0%,rgba(5,11,18,0)_100%)] px-4 pb-16 pt-9 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-14 lg:pt-18">
          <div className="mx-auto max-w-5xl">
            <SectionDivider />
            <Reveal>
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 px-5 py-7 text-center backdrop-blur-xl sm:rounded-[34px] sm:px-8 sm:py-10">
                <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
                  <EtheralShadow
                    hideCenterText
                    color="rgba(16, 185, 129, 0.78)"
                    animation={{ scale: 72, speed: 42 }}
                    noise={{ opacity: 0.34, scale: 1.15 }}
                    sizing="fill"
                    className="size-full"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%)]" />
                <div className="relative z-10">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-300/85 sm:text-[11px]">
                  Volte ao controle da sua vida financeira
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-white sm:text-5xl">Pare de tentar se organizar na força.</h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Deixe o Contai cuidar das contas, lembretes e compromissos no WhatsApp.
                </p>
                <Button asChild className="mt-8 h-12 rounded-full bg-emerald-500 px-6 text-base text-white hover:bg-emerald-400">
                  <a href={primaryHref}>
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="border-t border-white/8 px-4 pb-28 pt-8 sm:px-6 sm:pb-24 lg:px-8 lg:pb-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Contai. Seu financeiro e sua rotina organizados no WhatsApp.</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/privacy">
                <a className="transition hover:text-white">Política de Privacidade</a>
              </Link>
              <Link href="/terms">
                <a className="transition hover:text-white">Termos de Serviço</a>
              </Link>
              <Link href="/data-deletion">
                <a className="transition hover:text-white">Exclusão de dados</a>
              </Link>
            </div>
          </div>
        </footer>
      </main>

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#07101a]/92 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden"
      >
          <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">Plano Contai</p>
            <p className="text-xs text-slate-300">Mensal R$14,90 ou anual R$99,90</p>
          </div>
          <Button asChild className="h-10 shrink-0 rounded-full bg-emerald-500 px-4 text-sm text-white shadow-[0_12px_30px_rgba(16,185,129,0.28)] hover:bg-emerald-400">
            <a href={primaryHref}>Começar</a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}



