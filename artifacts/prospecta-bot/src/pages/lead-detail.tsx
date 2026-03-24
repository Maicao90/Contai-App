import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Badge, Button, Input, Textarea } from "@/components/ui/shared";
import {
  useGetLead,
  useGetLeadMessage,
  useUpdateLead,
  getListLeadsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { LeadStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Globe, MapPin, Building2,
  Flame, ThermometerSun, Snowflake, Check, Copy,
  ExternalLink, ChevronDown, Code2, Loader2,
  MessageCircle, TrendingUp, Rocket, Star, Instagram,
} from "lucide-react";
import { getConversao, conversaoBadgeColor } from "@/lib/nichos";

type PromptTab = "blueprint" | "generico" | "compacto";
type MsgTab = "contato" | "followup";

const STATUS_CONFIG: { key: LeadStatus; label: string; color: string; active: string }[] = [
  { key: "Novo",       label: "Novo",       color: "border-border text-muted-foreground hover:border-primary/60 hover:text-white", active: "border-primary bg-primary/20 text-primary" },
  { key: "Contatado",  label: "Contatado",  color: "border-border text-muted-foreground hover:border-blue-500/60 hover:text-white",  active: "border-blue-500 bg-blue-500/15 text-blue-400" },
  { key: "Convertido", label: "Convertido", color: "border-border text-muted-foreground hover:border-emerald-500/60 hover:text-white", active: "border-emerald-500 bg-emerald-500/15 text-emerald-400" },
  { key: "Perdido",    label: "Perdido",    color: "border-border text-muted-foreground hover:border-red-500/60 hover:text-white",    active: "border-red-500 bg-red-500/15 text-red-400" },
  { key: "Ignorado",   label: "Ignorado",   color: "border-border text-muted-foreground hover:border-zinc-500/60 hover:text-white",   active: "border-zinc-500 bg-zinc-500/15 text-zinc-400" },
];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = parseInt(id ?? "0");

  const { data: lead, isLoading: leadLoading } = useGetLead(leadId, {
    query: { enabled: !!leadId },
  });

  const { data: msgData, isLoading: msgLoading } = useGetLeadMessage(leadId, {
    query: { enabled: !!leadId },
  });
  const msg = msgData as any;

  const [status, setStatus] = useState<LeadStatus>("Novo");
  const [demoUrl, setDemoUrl] = useState("");
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [generatedDemoPath, setGeneratedDemoPath] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [promptTab, setPromptTab] = useState<PromptTab>("blueprint");
  const [msgTab, setMsgTab] = useState<MsgTab>("contato");
  const [showPrompt, setShowPrompt] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
    if (lead) setStatus(lead.status as LeadStatus);
  }, [lead]);

  useEffect(() => {
    if (msg?.demoUrl && !demoUrl) setDemoUrl(msg.demoUrl);
  }, [msg?.demoUrl]);

  useEffect(() => {
    if (msg?.mensagem && !editedMessage) setEditedMessage(msg.mensagem);
  }, [msg?.mensagem]);

  const handleStatusChange = (s: LeadStatus) => {
    setStatus(s);
    updateMutation.mutate({ id: leadId, data: { status: s } });
  };

  const copyToClipboard = async (text: string, type: "msg" | "prompt") => {
    await navigator.clipboard.writeText(text);
    if (type === "msg") { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); }
    else { setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000); }
    toast({ title: "Copiado!" });
  };

  const buildWhatsappUrl = () => {
    const rawPhone = lead?.telefone?.replace(/\D/g, "") ?? "";
    if (rawPhone.length < 10) return null;
    return `https://wa.me/55${rawPhone}?text=${encodeURIComponent(editedMessage)}`;
  };

  const handleGenerateDemo = async () => {
    if (!leadId) return;
    setGeneratingDemo(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate-demo`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { slug: string; demoPath: string };
      const fullUrl = `${window.location.origin}${data.demoPath}`;
      setGeneratedDemoPath(data.demoPath);
      setDemoUrl(fullUrl);
      toast({ title: "Demo gerada com sucesso!", description: "Página disponível agora." });
    } catch {
      toast({ title: "Erro ao gerar demo", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setGeneratingDemo(false);
    }
  };

  const currentPrompt = msg?.prompts?.[promptTab] ?? msg?.promptDemo ?? "";

  if (leadLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Lead não encontrado.</p>
          <Button className="mt-4" onClick={() => navigate("/leads")}>Voltar aos Leads</Button>
        </div>
      </Layout>
    );
  }

  const TemperaturaIcon = lead.temperatura === "Quente" ? Flame
    : lead.temperatura === "Morno" ? ThermometerSun : Snowflake;

  const taxa = getConversao(lead.nicho);

  return (
    <Layout>
      <div className="space-y-6 pb-16 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate("/leads")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">{lead.nomeEmpresa}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={lead.temperatura === "Quente" ? "danger" : lead.temperatura === "Morno" ? "warning" : "info"} className="gap-1">
              <TemperaturaIcon className="w-3 h-3" />
              {lead.temperatura}
            </Badge>
            <Badge variant={
              status === "Convertido" ? "success" :
              status === "Contatado" ? "info" :
              status === "Perdido" ? "danger" : "default"
            }>
              {status}
            </Badge>
            {taxa && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${conversaoBadgeColor(taxa)}`}>
                <TrendingUp className="w-3 h-3" />
                {taxa}% conv.
              </span>
            )}
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT (3 cols) ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Informações */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Informações</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Telefone" icon={<Phone className="w-3.5 h-3.5" />}
                  value={lead.telefone ?? "—"}
                />
                <InfoField label="E-mail" value="—" />
                <InfoField label="Website" icon={<Globe className="w-3.5 h-3.5" />}
                  value={lead.urlSite
                    ? <a href={lead.urlSite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{lead.urlSite}</a>
                    : "—"}
                />
                <InfoField label="Endereço" value="—" />
                <InfoField label="Cidade" icon={<MapPin className="w-3.5 h-3.5" />}
                  value={lead.cidade}
                />
                <InfoField label="Nicho" icon={<Building2 className="w-3.5 h-3.5" />}
                  value={lead.nicho}
                />
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Instagram className="w-3 h-3" /> Instagram
                  </p>
                  {lead.urlInstagram ? (
                    <a
                      href={lead.urlInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-pink-400 hover:text-pink-300 hover:underline truncate flex items-center gap-1.5 transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5 shrink-0" />
                      {lead.urlInstagram}
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </Card>

            {/* Análise do Site */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Análise do Site</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                <InfoField label="Tem Website" value={lead.temSite ? "Sim" : "Não"} highlight={!lead.temSite ? "danger" : "success"} />
                <InfoField label="Pixel Meta (Facebook)" value={lead.temPixelMeta ? "Configurado" : "Não encontrado"} highlight={!lead.temPixelMeta ? "warn" : "success"} />
                <InfoField label="Pixel Google (Analytics)" value={lead.temPixelGoogle ? "Configurado" : "Não encontrado"} highlight={!lead.temPixelGoogle ? "warn" : "success"} />
                <InfoField label="Score de Oportunidade" value={`${lead.score}/100`} highlight={lead.score >= 70 ? "danger" : lead.score >= 35 ? "warn" : "info"} />
              </div>

              {/* Google Meu Negócio */}
              <div className="border border-border/40 rounded-xl p-4 mt-2 bg-background/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base shrink-0">🗺️</div>
                    <div>
                      <p className="text-xs font-semibold text-white">Google Meu Negócio</p>
                      <p className="text-xs text-muted-foreground">Presença no Google Maps</p>
                    </div>
                  </div>

                  {lead.temGoogleMeuNegocio ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Star rating */}
                      {lead.notaGoogle != null && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(i => {
                              const filled = lead.notaGoogle! >= i;
                              const half = !filled && lead.notaGoogle! >= i - 0.5;
                              return (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${filled || half ? "fill-amber-400 text-amber-400" : "text-border"}`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-amber-400 font-bold text-sm">{lead.notaGoogle.toFixed(1)}</span>
                        </div>
                      )}
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(lead.nomeEmpresa + " " + lead.cidade)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <Check className="w-3 h-3" /> Tem perfil
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-semibold border border-red-500/30 bg-red-500/10 px-2.5 py-1 rounded-full">
                        ✕ Sem perfil — grande oportunidade!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="bg-background/40 rounded-xl p-3 border border-border/50 mt-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Motivo da classificação:</p>
                <div className="space-y-1">
                  {[
                    { label: "Sem site próprio",               pontos: 70, ativo: !lead.temSite },
                    { label: "Sem Pixel Meta (anúncios)",      pontos: 35, ativo: lead.temSite && !lead.temPixelMeta },
                    { label: "Sem Pixel Google (analytics)",   pontos: 20, ativo: lead.temSite && !lead.temPixelGoogle },
                    { label: "Base — todo prospect tem valor", pontos: 15, ativo: true },
                  ].filter(i => i.ativo).map(({ label, pontos }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-white/80 flex-1">{label}</span>
                      <span className="text-primary font-mono font-bold">+{pontos}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Alterar Status */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Alterar Status</h2>
              <div className="flex flex-wrap gap-2">
                {STATUS_CONFIG.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleStatusChange(s.key)}
                    disabled={updateMutation.isPending}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                      status === s.key ? s.active : s.color
                    )}
                  >
                    {updateMutation.isPending && status === s.key
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
                      : null}
                    {s.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* ── RIGHT (2 cols) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Score */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">Score de Oportunidade</h2>
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center",
                  lead.score >= 70 ? "border-red-500" : lead.score >= 35 ? "border-amber-500" : "border-blue-500"
                )}>
                  <span className={cn("text-4xl font-display font-bold",
                    lead.score >= 70 ? "text-red-400" : lead.score >= 35 ? "text-amber-400" : "text-blue-400"
                  )}>
                    {lead.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <div className="w-full bg-background/80 rounded-full h-2.5 overflow-hidden border border-border/50">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      lead.score >= 70 ? "bg-red-500" : lead.score >= 35 ? "bg-amber-500" : "bg-blue-500"
                    )}
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
                <Badge variant={lead.temperatura === "Quente" ? "danger" : lead.temperatura === "Morno" ? "warning" : "info"} className="gap-1">
                  <TemperaturaIcon className="w-3 h-3" />
                  {lead.temperatura}
                </Badge>
              </div>
            </Card>

            {/* Landing Page */}
            <Card className="p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Landing Page Demo</h2>

              {/* Generate Demo Button */}
              <Button
                className={cn(
                  "w-full gap-2 font-bold transition-all",
                  generatedDemoPath
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
                )}
                onClick={handleGenerateDemo}
                disabled={generatingDemo}
              >
                {generatingDemo ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Gerando página...</>
                ) : generatedDemoPath ? (
                  <><Check className="w-4 h-4" /> Demo Gerada! Gerar Novamente</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Gerar Demo com 1 Clique</>
                )}
              </Button>

              {/* Generated URL display */}
              {generatedDemoPath && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2"
                >
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Página disponível agora
                  </p>
                  <a
                    href={`${window.location.origin}${generatedDemoPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-mono break-all hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {`${window.location.origin}${generatedDemoPath}`}
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 h-7 text-xs border-emerald-500/40 text-emerald-400 hover:text-emerald-300"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${window.location.origin}${generatedDemoPath}`);
                      toast({ title: "URL copiada!" });
                    }}
                  >
                    <Copy className="w-3 h-3" /> Copiar URL
                  </Button>
                </motion.div>
              )}

              {/* Manual URL input */}
              <div className="flex gap-2">
                <Input
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                  placeholder="https://empresa.replit.app"
                  className="text-sm font-mono text-xs"
                />
                <Button size="sm" variant="outline" onClick={() => toast({ title: "URL salva!" })}>
                  Salvar
                </Button>
              </div>

              {/* Prompt section */}
              <div className="border border-border rounded-xl overflow-hidden bg-background/30">
                <button
                  className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                  onClick={() => setShowPrompt(!showPrompt)}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-[#f26207]/20 text-[#f26207] px-2 py-0.5 rounded-full font-semibold border border-[#f26207]/30">
                      <Code2 className="w-3 h-3" />
                      Replit Agent
                    </span>
                    <span className="text-xs font-semibold text-foreground">Gerar Prompt</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0 text-muted-foreground", showPrompt && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showPrompt && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-3 pt-0 border-t border-border/50 space-y-2">
                        <div className="flex gap-1 bg-background/60 p-1 rounded-lg border border-border/50 mt-2">
                          {([
                            { key: "blueprint", label: "Blueprint", desc: "Completo" },
                            { key: "generico",  label: "Genérico",  desc: "Médio" },
                            { key: "compacto",  label: "Compacto",  desc: "Rápido" },
                          ] as const).map(tab => (
                            <button
                              key={tab.key}
                              onClick={() => setPromptTab(tab.key)}
                              className={cn(
                                "flex-1 py-1 px-1.5 rounded-md text-[10px] font-semibold transition-all",
                                promptTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                              )}
                            >
                              {tab.label}
                              <span className="block font-normal opacity-70">{tab.desc}</span>
                            </button>
                          ))}
                        </div>
                        <div className="relative group">
                          <Textarea
                            readOnly
                            value={msgLoading ? "Carregando..." : currentPrompt}
                            className={cn("text-[11px] font-mono bg-black/40 leading-relaxed",
                              promptTab === "blueprint" ? "min-h-[180px]" : promptTab === "generico" ? "min-h-[120px]" : "min-h-[80px]"
                            )}
                          />
                          <button
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 border border-border rounded p-1"
                            onClick={() => copyToClipboard(currentPrompt, "prompt")}
                          >
                            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                        <Button variant="outline" className="w-full gap-2 text-xs h-8" onClick={() => copyToClipboard(currentPrompt, "prompt")}>
                          {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedPrompt ? "Copiado!" : "Copiar Prompt"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Gerar Mensagem */}
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Gerar Mensagem
              </h2>

              {/* Tabs */}
              <div className="flex gap-1 bg-background/60 p-1 rounded-lg border border-border/50">
                {[
                  { key: "contato",  label: "1º Contato" },
                  { key: "followup", label: "Follow-up" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setMsgTab(t.key as MsgTab);
                      setEditedMessage(msg?.mensagem ?? "");
                    }}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all",
                      msgTab === t.key ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {msgLoading ? (
                <div className="h-40 flex items-center justify-center bg-background/40 rounded-xl border border-border/50">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Textarea
                  value={msgTab === "contato" ? editedMessage : `Olá *${lead.nomeEmpresa}*! 👋\n\nPassando para dar um retorno sobre a proposta que enviei.\n\nA landing page demonstrativa já está disponível em:\n🔗 ${demoUrl || msg?.demoUrl || ""}\n\nTem alguma dúvida ou quer conversar sobre como isso pode ajudar o negócio de vocês?\n\nAguardo seu retorno! 😊`}
                  onChange={e => { if (msgTab === "contato") setEditedMessage(e.target.value); }}
                  className="min-h-[140px] text-sm leading-relaxed bg-black/20"
                  readOnly={msgTab === "followup"}
                />
              )}

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={msgLoading}
                  onClick={() => copyToClipboard(msgTab === "contato" ? editedMessage : `Olá *${lead.nomeEmpresa}*! 👋\n\nPassando para dar um retorno sobre a proposta que enviei.\n\nA landing page demonstrativa já está disponível em:\n🔗 ${demoUrl || msg?.demoUrl || ""}\n\nTem alguma dúvida ou quer conversar sobre como isso pode ajudar o negócio de vocês?\n\nAguardo seu retorno! 😊`, "msg")}
                >
                  {copiedMsg ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedMsg ? "Copiado!" : "Copiar Mensagem"}
                </Button>
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  disabled={msgLoading || !buildWhatsappUrl()}
                  onClick={() => {
                    const url = buildWhatsappUrl();
                    if (url) {
                      window.open(url, "_blank");
                      if (status === "Novo") handleStatusChange("Contatado");
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
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

function InfoField({
  label, value, icon, highlight,
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
      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={cn("text-sm font-medium", valueColor)}>
        {value}
      </p>
    </div>
  );
}
