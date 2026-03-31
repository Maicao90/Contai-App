import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardStatsQueryKey,
  getListLeadsQueryKey,
  LeadStatus,
  useGetLead,
  useGetLeadMessage,
  useUpdateLead,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui/shared";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { conversaoBadgeColor, getConversao } from "@/lib/nichos";
import { buildCanonicalWhatsappUrl, formatBrazilianContact } from "@/lib/whatsapp";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Instagram,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  ThermometerSun,
  TrendingUp,
} from "lucide-react";

type MsgTab = "contato" | "followup";
type UiLeadStatus = LeadStatus | "Perdido" | "Ignorado";
const LEADS_RETURN_URL_KEY = "prospecta.leads.returnUrl";

const STATUS_CONFIG: { key: UiLeadStatus; label: string; color: string; active: string }[] = [
  { key: "Novo", label: "Novo", color: "border-border text-muted-foreground hover:border-primary/60 hover:text-white", active: "border-primary bg-primary/20 text-primary" },
  { key: "Contatado", label: "Contatado", color: "border-border text-muted-foreground hover:border-blue-500/60 hover:text-white", active: "border-blue-500 bg-blue-500/15 text-blue-400" },
  { key: "Convertido", label: "Convertido", color: "border-border text-muted-foreground hover:border-emerald-500/60 hover:text-white", active: "border-emerald-500 bg-emerald-500/15 text-emerald-400" },
  { key: "Perdido", label: "Perdido", color: "border-border text-muted-foreground hover:border-red-500/60 hover:text-white", active: "border-red-500 bg-red-500/15 text-red-400" },
  { key: "Ignorado", label: "Ignorado", color: "border-border text-muted-foreground hover:border-zinc-500/60 hover:text-white", active: "border-zinc-500 bg-zinc-500/15 text-zinc-400" },
];

function formatPhoneDisplay(value: string | null | undefined): string {
  return formatBrazilianContact(value) ?? value ?? "-";
}

function normalizeDemoUrl(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/[)\]}>,;]+$/g, "");
}

function isUsablePublicDemoUrl(value: string | null | undefined): boolean {
  const normalized = normalizeDemoUrl(value);
  if (!normalized) return false;
  if (normalized.includes("localhost.run/]/")) return false;
  if (normalized.includes("admin.localhost.run")) return false;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function InfoField({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: "danger" | "success" | "warn" | "info";
}) {
  const valueColor =
    highlight === "danger" ? "text-red-400" :
    highlight === "success" ? "text-emerald-400" :
    highlight === "warn" ? "text-amber-400" :
    highlight === "info" ? "text-blue-400" :
    "text-white";

  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className={cn("break-words text-sm font-medium", valueColor)}>{value}</div>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = Number.parseInt(id ?? "0", 10);

  const { data: lead, isLoading: leadLoading } = useGetLead(leadId, {
    query: { enabled: !!leadId } as any,
  });

  const { data: msgData, isLoading: msgLoading } = useGetLeadMessage(leadId, {
    query: { enabled: !!leadId } as any,
  });

  const msg = msgData as (typeof msgData & {
    demoPath?: string | null;
    demoUrl?: string | null;
    localDemoUrl?: string | null;
    publicDemoUrl?: string | null;
    whatsappUrl?: string | null;
  }) | undefined;

  const [status, setStatus] = useState<UiLeadStatus>("Novo");
  const [demoUrl, setDemoUrl] = useState("");
  const [publicDemoUrl, setPublicDemoUrl] = useState("");
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [sharingDemo, setSharingDemo] = useState(false);
  const [generatedDemoPath, setGeneratedDemoPath] = useState<string | null>(null);
  const [loadingExistingDemo, setLoadingExistingDemo] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [msgTab, setMsgTab] = useState<MsgTab>("contato");

  const updateMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Status atualizado!", variant: "success" });
      },
    },
  });

  useEffect(() => {
    if (lead) setStatus(lead.status as UiLeadStatus);
  }, [lead]);

  useEffect(() => {
    if (msg?.mensagem) setEditedMessage(msg.mensagem);
  }, [msg?.mensagem]);

  useEffect(() => {
    if (msg?.demoPath) {
      setGeneratedDemoPath(msg.demoPath);
    }
    if (msg?.demoUrl) {
      setDemoUrl(normalizeDemoUrl(msg.demoUrl));
    }
    if (isUsablePublicDemoUrl(msg?.publicDemoUrl)) {
      setPublicDemoUrl(normalizeDemoUrl(msg?.publicDemoUrl));
    } else if (msg?.publicDemoUrl) {
      setPublicDemoUrl("");
    }
  }, [msg?.demoPath, msg?.demoUrl, msg?.publicDemoUrl]);

  useEffect(() => {
    let cancelled = false;

    const loadExistingDemo = async () => {
      if (!leadId) return;
      setLoadingExistingDemo(true);
      try {
        const response = await fetch(`/api/leads/${leadId}/demo`);
        if (!response.ok) return;

        const data = await response.json() as { demoPath: string; url: string };
        if (cancelled) return;

        setGeneratedDemoPath(data.demoPath);
        setDemoUrl(normalizeDemoUrl(data.url));
      } catch {
        // No existing demo yet.
      } finally {
        if (!cancelled) setLoadingExistingDemo(false);
      }
    };

    void loadExistingDemo();

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  useEffect(() => {
    let cancelled = false;

    const refreshBrokenPublicLink = async () => {
      if (!leadId || !generatedDemoPath) return;
      if (isUsablePublicDemoUrl(publicDemoUrl)) return;

      setSharingDemo(true);
      try {
        const res = await fetch(`/api/leads/${leadId}/share-demo`, { method: "POST" });
        if (!res.ok) return;

        const data = await res.json() as { demoPath: string; localUrl: string; publicUrl: string };
        if (cancelled) return;

        setGeneratedDemoPath(data.demoPath);
        setDemoUrl(normalizeDemoUrl(data.localUrl));
        setPublicDemoUrl(isUsablePublicDemoUrl(data.publicUrl) ? normalizeDemoUrl(data.publicUrl) : "");
      } catch {
        setPublicDemoUrl("");
      } finally {
        if (!cancelled) setSharingDemo(false);
      }
    };

    void refreshBrokenPublicLink();

    return () => {
      cancelled = true;
    };
  }, [generatedDemoPath, leadId, publicDemoUrl]);

  const handleStatusChange = (nextStatus: UiLeadStatus) => {
    setStatus(nextStatus);
    updateMutation.mutate({ id: leadId, data: { status: nextStatus as any } });
  };

  const copyToClipboard = async (text: string, successTitle: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast({ title: successTitle, variant: "success" });
  };

  const buildWhatsappUrl = () => {
    return msg?.whatsappUrl ?? buildCanonicalWhatsappUrl(lead?.whatsapp ?? lead?.telefone, editedMessage);
  };

  const navigateBackToLeads = () => {
    const returnUrl = window.sessionStorage.getItem(LEADS_RETURN_URL_KEY);
    navigate(returnUrl || "/leads");
  };

  const handleGenerateDemo = async () => {
    if (!leadId) return;
    setGeneratingDemo(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate-demo`, { method: "POST" });
      if (!res.ok) throw new Error("failed");

      const data = await res.json() as { demoPath: string; url: string };
      setGeneratedDemoPath(data.demoPath);
      setDemoUrl(normalizeDemoUrl(data.url));
      toast({
        title: "Demo gerada com sucesso!",
        description: "A pagina ja esta pronta para abrir e compartilhar.",
        variant: "success",
      });
    } catch {
      toast({ title: "Erro ao gerar demo", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setGeneratingDemo(false);
    }
  };

  const handleOpenDemo = () => {
    if (!demoUrl) return;
    window.open(demoUrl, "_blank", "noopener,noreferrer");
  };

  const handleCreatePublicDemoLink = async () => {
    if (!leadId) return;
    setSharingDemo(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/share-demo`, { method: "POST" });
      if (!res.ok) throw new Error("failed");

      const data = await res.json() as { demoPath: string; localUrl: string; publicUrl: string };
      setGeneratedDemoPath(data.demoPath);
      setDemoUrl(normalizeDemoUrl(data.localUrl));
      setPublicDemoUrl(isUsablePublicDemoUrl(data.publicUrl) ? normalizeDemoUrl(data.publicUrl) : "");
      toast({
        title: "Link publico criado",
        description: "Agora voce ja pode enviar a demo para outra pessoa abrir fora do seu PC.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Nao foi possivel criar o link publico",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setSharingDemo(false);
    }
  };

  const uniquePrompt = useMemo(() => {
    if (!lead) return "";

    const analysisReason = [
      !lead.temSite ? "nao tem site proprio" : "tem site proprio",
      lead.temSite && !lead.temPixelMeta ? "sem Pixel Meta" : lead.temSite ? "Pixel Meta identificado" : null,
      lead.temSite && !lead.temPixelGoogle ? "sem Pixel Google" : lead.temSite ? "Pixel Google identificado" : null,
      lead.whatsappVerificado ? "WhatsApp validado" : lead.whatsapp ? "WhatsApp encontrado, mas nao validado" : "sem WhatsApp encontrado",
      lead.temGoogleMeuNegocio ? "presenca no Google Meu Negocio" : "sem sinal forte de Google Meu Negocio",
      lead.urlInstagram ? "Instagram encontrado" : "sem Instagram encontrado",
      lead.fonteBusca ? `fonte ${lead.fonteBusca}` : null,
    ].filter(Boolean).join("; ");

    return `Prompt unico para ${lead.nomeEmpresa}

Empresa: ${lead.nomeEmpresa}
Nicho: ${lead.nicho}
Cidade: ${lead.cidade}/${lead.uf}
Site atual: ${lead.urlSite ?? "nao encontrado"}
URL de origem: ${lead.urlOrigem ?? "nao encontrada"}
Instagram: ${lead.urlInstagram ?? "nao encontrado"}
Telefone: ${lead.telefone ?? "nao encontrado"}
WhatsApp: ${formatPhoneDisplay(lead.whatsapp)}
Score: ${lead.score}/100
Resumo da analise: ${analysisReason}

Objetivo do site demonstrativo:
- site simples
- visual limpo
- gerar confianca imediata
- parecer feito especificamente para este cliente
- evitar aparencia generica de template

Direcao obrigatoria:
- usar linguagem profissional e humana
- destacar a cidade ${lead.cidade} de forma natural
- criar um hero claro, poucos blocos e CTA forte
- evitar excesso de efeitos, cores e informacoes
- transmitir credibilidade, clareza e presenca local
- se houver fraquezas digitais, corrigi-las de forma sutil na demo

Estrutura recomendada:
1. Hero com proposta de valor especifica para ${lead.nomeEmpresa}
2. Bloco de confianca com 3 diferenciais reais
3. Sessao de servicos principais
4. Como funciona em 3 passos
5. FAQ curto
6. CTA final com WhatsApp
7. Rodape simples e profissional

${msg?.promptDemo ? `Base do prompt:\n${msg.promptDemo}` : ""}`;
  }, [lead, msg?.promptDemo]);

  if (leadLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Lead nao encontrado.</p>
          <Button className="mt-4" onClick={navigateBackToLeads}>Voltar aos Leads</Button>
        </div>
      </Layout>
    );
  }

  const TemperaturaIcon =
    lead.temperatura === "Quente" ? Flame :
    lead.temperatura === "Morno" ? ThermometerSun :
    Snowflake;

  const taxa = getConversao(lead.nicho);
  const analysisReason = [
    !lead.temSite ? "nao tem site proprio" : "tem site proprio",
    lead.temSite && !lead.temPixelMeta ? "sem Pixel Meta" : lead.temSite ? "Pixel Meta identificado" : null,
    lead.temSite && !lead.temPixelGoogle ? "sem Pixel Google" : lead.temSite ? "Pixel Google identificado" : null,
    lead.whatsappVerificado ? "WhatsApp validado" : lead.whatsapp ? "WhatsApp encontrado, mas nao validado" : "sem WhatsApp encontrado",
    lead.temGoogleMeuNegocio ? "presenca no Google Meu Negocio" : "sem sinal forte de Google Meu Negocio",
    lead.urlInstagram ? "Instagram encontrado" : "sem Instagram encontrado",
    lead.fonteBusca ? `fonte ${lead.fonteBusca}` : null,
  ].filter(Boolean).join("; ");

  const followupMessage = `Ola *${lead.nomeEmpresa}*! 👋

Passando para retomar o contato sobre a oportunidade que identifiquei para ${lead.nicho} em ${lead.cidade}.

${demoUrl ? `A demo esta aqui:\n${demoUrl}\n\n` : ""}Se quiser, eu tambem posso te explicar rapidamente os pontos que encontrei no site e no contato da empresa.`;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 pb-16">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={navigateBackToLeads}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">{lead.nomeEmpresa}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={lead.temperatura === "Quente" ? "danger" : lead.temperatura === "Morno" ? "warning" : "info"} className="gap-1">
              <TemperaturaIcon className="h-3 w-3" />
              {lead.temperatura}
            </Badge>
            <Badge variant={status === "Convertido" ? "success" : status === "Contatado" ? "info" : status === "Perdido" ? "danger" : "default"}>
              {status}
            </Badge>
            {taxa ? (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${conversaoBadgeColor(taxa)}`}>
                <TrendingUp className="h-3 w-3" />
                {taxa}% conv.
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Informacoes do Lead</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Telefone" icon={<Phone className="h-3.5 w-3.5" />} value={lead.telefone ?? "-"} />
                <InfoField label="WhatsApp" icon={<MessageCircle className="h-3.5 w-3.5" />} value={formatPhoneDisplay(lead.whatsapp)} highlight={lead.whatsappVerificado ? "success" : lead.whatsapp ? "warn" : "danger"} />
                <InfoField label="Email" icon={<Link2 className="h-3.5 w-3.5" />} value={lead.email ?? "-"} highlight={lead.email ? "info" : undefined} />
                <InfoField label="Status do WhatsApp" icon={<ShieldCheck className="h-3.5 w-3.5" />} value={lead.whatsappVerificado ? "Validado no site/perfil" : lead.whatsapp ? "Encontrado, mas nao validado" : "Nao encontrado"} highlight={lead.whatsappVerificado ? "success" : lead.whatsapp ? "warn" : "danger"} />
                <InfoField label="Website" icon={<Globe className="h-3.5 w-3.5" />} value={lead.urlSite ? <a href={lead.urlSite} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{lead.urlSite}</a> : "-"} />
                <InfoField label="Cidade" icon={<MapPin className="h-3.5 w-3.5" />} value={`${lead.cidade} / ${lead.uf}`} />
                <InfoField label="Nicho" icon={<Building2 className="h-3.5 w-3.5" />} value={lead.nicho} />
                <InfoField label="Origem Encontrada" icon={<Search className="h-3.5 w-3.5" />} value={lead.fonteBusca ?? "-"} />
                <InfoField label="Data do Lead" value={new Date(lead.dataCadastro).toLocaleString("pt-BR")} />
                <InfoField label="Google Meu Negocio" value={lead.temGoogleMeuNegocio ? "Encontrado" : "Nao identificado"} highlight={lead.temGoogleMeuNegocio ? "success" : "warn"} />
                <div className="col-span-2">
                  <InfoField label="URL de Origem" value={lead.urlOrigem ? <a href={lead.urlOrigem} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{lead.urlOrigem}</a> : "-"} />
                </div>
                <InfoField label="Instagram" icon={<Instagram className="h-3.5 w-3.5" />} value={lead.urlInstagram ? <a href={lead.urlInstagram} target="_blank" rel="noopener noreferrer" className="break-all text-pink-400 hover:underline">{lead.urlInstagram}</a> : "-"} highlight={lead.urlInstagram ? "success" : undefined} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Analise do Site</h2>
              <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-3">
                <InfoField label="Tem Website" value={lead.temSite ? "Sim" : "Nao"} highlight={lead.temSite ? "success" : "danger"} />
                <InfoField label="Google Meu Negocio" value={lead.temGoogleMeuNegocio ? "Encontrado" : "Nao encontrado"} highlight={lead.temGoogleMeuNegocio ? "success" : "warn"} />
                <InfoField label="Pixel Meta" value={lead.temPixelMeta ? "Configurado" : "Nao encontrado"} highlight={lead.temPixelMeta ? "success" : "warn"} />
                <InfoField label="Pixel Google" value={lead.temPixelGoogle ? "Configurado" : "Nao encontrado"} highlight={lead.temPixelGoogle ? "success" : "warn"} />
                <InfoField label="Instagram" value={lead.urlInstagram ? "Encontrado" : "Nao encontrado"} highlight={lead.urlInstagram ? "success" : "warn"} />
                <InfoField label="Canal principal" value={lead.whatsapp ? "WhatsApp / Telefone" : lead.telefone ? "Telefone" : "Sem contato forte"} highlight={lead.whatsappVerificado ? "success" : lead.telefone ? "info" : "danger"} />
              </div>

              <div className="rounded-xl border border-border/40 bg-background/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Presenca no Google</p>
                    <p className="text-xs text-muted-foreground">Visibilidade local e reputacao</p>
                  </div>
                  {lead.notaGoogle != null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`h-4 w-4 ${lead.notaGoogle != null && lead.notaGoogle >= i ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-amber-400">{lead.notaGoogle.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem nota coletada</span>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-border/50 bg-background/40 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Motivos do score</p>
                <div className="space-y-1">
                  {[
                    { label: "Sem site proprio", pontos: 70, ativo: !lead.temSite },
                    { label: "Sem Pixel Meta", pontos: 35, ativo: lead.temSite && !lead.temPixelMeta },
                    { label: "Sem Pixel Google", pontos: 20, ativo: lead.temSite && !lead.temPixelGoogle },
                    { label: "Base do prospect", pontos: 15, ativo: true },
                  ].filter((item) => item.ativo).map(({ label, pontos }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400">+</span>
                      <span className="flex-1 text-white/80">{label}</span>
                      <span className="font-mono font-bold text-primary">+{pontos}pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-border/50 bg-background/40 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Resumo da analise</p>
                <p className="text-sm leading-relaxed text-white/80">{analysisReason}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alterar Status</h2>
              <div className="flex flex-wrap gap-2">
                {STATUS_CONFIG.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleStatusChange(item.key)}
                    disabled={updateMutation.isPending}
                    className={cn("rounded-lg border px-4 py-2 text-sm font-semibold transition-all", status === item.key ? item.active : item.color)}
                  >
                    {updateMutation.isPending && status === item.key ? <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : null}
                    {item.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <Card className="p-6">
              <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">Score</h2>
              <div className="flex flex-col items-center gap-3">
                <div className={cn("flex h-28 w-28 flex-col items-center justify-center rounded-full border-4", lead.score >= 70 ? "border-red-500" : lead.score >= 35 ? "border-amber-500" : "border-blue-500")}>
                  <span className={cn("text-4xl font-bold", lead.score >= 70 ? "text-red-400" : lead.score >= 35 ? "text-amber-400" : "text-blue-400")}>{lead.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-border/50 bg-background/80">
                  <div className={cn("h-full rounded-full", lead.score >= 70 ? "bg-red-500" : lead.score >= 35 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${lead.score}%` }} />
                </div>
                <Badge variant={lead.temperatura === "Quente" ? "danger" : lead.temperatura === "Morno" ? "warning" : "info"} className="gap-1">
                  <TemperaturaIcon className="h-3 w-3" />
                  {lead.temperatura}
                </Badge>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Landing Page Demo</h2>

              <Button
                className="w-full gap-2 border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                onClick={handleGenerateDemo}
                disabled={generatingDemo}
              >
                {generatingDemo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando pagina...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Gerar Demo com 1 Clique
                  </>
                )}
              </Button>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Link da demo</p>
                    <p className="text-xs text-muted-foreground">
                      {generatedDemoPath ? "Essa pagina ja pode ser aberta e enviada para o cliente." : "Gere a demo para criar um link visualizavel."}
                    </p>
                  </div>
                  {generatedDemoPath ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Pronta
                    </Badge>
                  ) : loadingExistingDemo ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verificando
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Aguardando
                    </Badge>
                  )}
                </div>

                <Input
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="Clique em Gerar Demo com 1 Clique"
                  className="font-mono text-xs"
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button className="gap-2" onClick={handleOpenDemo} disabled={!demoUrl}>
                    <ExternalLink className="h-4 w-4" />
                    Visualizar Demo
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(demoUrl, "Link da demo copiado!")} disabled={!demoUrl}>
                    <Link2 className="h-4 w-4" />
                    Copiar Link
                  </Button>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Link publico para compartilhar</p>
                    <p className="text-xs text-muted-foreground">Cria um link externo para o cliente abrir mesmo fora do seu computador.</p>
                  </div>
                  {publicDemoUrl ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Publico
                    </Badge>
                  ) : null}
                </div>

                <Input
                  value={publicDemoUrl}
                  onChange={(e) => setPublicDemoUrl(e.target.value)}
                  placeholder="Clique em Criar Link Publico"
                  className="font-mono text-xs"
                />

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button className="gap-2" onClick={handleCreatePublicDemoLink} disabled={sharingDemo}>
                    {sharingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    {sharingDemo ? "Criando link..." : "Criar Link Publico"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(publicDemoUrl, "Link publico copiado!")} disabled={!publicDemoUrl}>
                    <Copy className="h-4 w-4" />
                    Copiar Link Publico
                  </Button>
                </div>
              </div>

              {generatedDemoPath ? (
                <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Pagina disponivel agora para visualizacao
                  </p>
                  <a
                    href={demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 break-all text-xs text-emerald-300 hover:text-emerald-200 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {demoUrl}
                  </a>
                </div>
              ) : null}

              <div className="space-y-2 rounded-xl border border-border/60 bg-background/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt Unico do Cliente</p>
                <Textarea readOnly value={uniquePrompt} className="min-h-[260px] bg-black/20 font-mono text-[12px] leading-relaxed" />
                <Button variant="outline" className="w-full gap-2" onClick={() => copyToClipboard(uniquePrompt, "Prompt copiado!")}>
                  <Copy className="h-4 w-4" />
                  Copiar Prompt Unico
                </Button>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Database className="h-4 w-4" /> Mensagem do Lead
              </h2>

              <div className="flex gap-1 rounded-lg border border-border/50 bg-background/60 p-1">
                <button
                  onClick={() => setMsgTab("contato")}
                  className={cn("flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all", msgTab === "contato" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white")}
                >
                  1o Contato
                </button>
                <button
                  onClick={() => setMsgTab("followup")}
                  className={cn("flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all", msgTab === "followup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white")}
                >
                  Follow-up
                </button>
              </div>

              <Textarea
                value={msgTab === "contato" ? editedMessage : followupMessage}
                onChange={(e) => {
                  if (msgTab === "contato") setEditedMessage(e.target.value);
                }}
                className="min-h-[180px] bg-black/20 text-sm leading-relaxed"
                readOnly={msgTab === "followup" || msgLoading}
              />

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={msgLoading}
                  onClick={() => copyToClipboard(msgTab === "contato" ? editedMessage : followupMessage, "Mensagem copiada!")}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Mensagem
                </Button>
                <Button
                  className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
                  disabled={msgLoading || !buildWhatsappUrl()}
                  onClick={() => {
                    const url = buildWhatsappUrl();
                    if (url) {
                      window.open(url, "_blank");
                      if (status === "Novo") handleStatusChange("Contatado");
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no WhatsApp
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
