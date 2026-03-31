import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardStatsQueryKey,
  getListCampaignsQueryKey,
  useCreateCampaign,
  useDeleteCampaign,
  useListCampaigns,
  useListLeads,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  Clock3,
  Database,
  Globe2,
  Loader2,
  MapPin,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Square,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Badge, Button, Input, Select } from "@/components/ui/shared";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { clearMiningSession, getMiningSessionSnapshot, startCampaignMining, stopCampaignMining, subscribeMiningSession } from "@/lib/mining-session";
import { NICHOS, conversaoBadgeColor, getConversao } from "@/lib/nichos";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const COUNTRIES = ["Argentina", "Chile", "Colombia", "Espanha", "Estados Unidos", "Mexico", "Paraguai", "Peru", "Portugal", "Reino Unido", "Uruguai"];
const MIN_MINING_FEEDBACK_MS = 12000;
const MAX_CONVERSAO = Math.max(...NICHOS.map((nicho) => nicho.conversao));

type MiningStage = "collecting" | "validating" | "saving" | "completed";
type Mercado = "Nacional" | "Internacional";
type SitePreference = "todos" | "com-site" | "sem-site";

interface ActiveMiningState {
  campaignId: number;
  nome: string;
  nicho: string;
  cidade: string;
  uf: string;
  pais: string | null;
  mercado: Mercado;
  startedAt: number;
  foundLeads: number;
  whatsappLeads: number;
  verifiedWhatsappLeads: number;
  stage: MiningStage;
}

interface CampaignFormState {
  mercado: Mercado;
  nicho: string;
  preferenciaSite: SitePreference;
  cidade: string;
  uf: string;
  pais: string;
  nome: string;
}

interface CampaignCardData {
  id: number;
  nome: string;
  mercado: Mercado;
  nicho: string;
  preferenciaSite?: SitePreference;
  pais?: string | null;
  cidade: string;
  uf: string;
  status: string;
  taxaConversao?: number | null;
  totalLeads: number;
  leadsContatados?: number;
  dataCriacao: string;
}

interface CampaignLeadPreview {
  id: number;
  campanhaId: number | null;
  nomeEmpresa: string;
  cidade: string;
  uf: string;
  whatsapp: string | null;
  temperatura: string;
  status: string;
}

const INITIAL_FORM: CampaignFormState = {
  mercado: "Nacional",
  nicho: "",
  preferenciaSite: "todos",
  cidade: "",
  uf: "",
  pais: "Portugal",
  nome: "",
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getMiningStage(elapsedMs: number, completed: boolean): MiningStage {
  if (completed) return "completed";
  if (elapsedMs < 4000) return "collecting";
  if (elapsedMs < 8000) return "validating";
  return "saving";
}

function getMiningProgress(stage: MiningStage, elapsedMs: number): number {
  if (stage === "completed") return 100;
  if (stage === "collecting") return Math.min(48, 16 + elapsedMs / 140);
  if (stage === "validating") return Math.min(82, 50 + (elapsedMs - 4000) / 110);
  return Math.min(96, 84 + (elapsedMs - 8000) / 220);
}

function getStageLabel(stage: MiningStage): string {
  if (stage === "collecting") return "Coletando estabelecimentos";
  if (stage === "validating") return "Validando contatos e WhatsApp";
  if (stage === "saving") return "Salvando leads aprovados";
  return "Mineracao concluida";
}

function getStageHint(stage: MiningStage, elapsedMs: number): string {
  if (stage === "collecting") return `Varredura ativa ha ${formatElapsed(elapsedMs)}.`;
  if (stage === "validating") return "Conferindo telefones, links oficiais e presenca digital.";
  if (stage === "saving") return "Organizando os dados no funil e preparando a campanha.";
  return "Leads prontos para abrir no CRM.";
}

function getLocationLabel(cidade: string, uf: string, pais: string | null | undefined, mercado: Mercado): string {
  return mercado === "Internacional" ? `${cidade}, ${pais ?? "Internacional"}` : `${cidade}, ${uf}`;
}

function getCampaignBadge(campaign: CampaignCardData): { label: string; variant: "default" | "success" | "warning" } {
  if (campaign.totalLeads === 0) {
    return { label: "Rascunho", variant: "default" };
  }

  if (campaign.status === "Pausada") {
    return { label: "Pausada", variant: "warning" };
  }

  return { label: "Ativa", variant: "success" };
}

function getSitePreferenceLabel(value: SitePreference | null | undefined): string {
  if (value === "com-site") return "Com site";
  if (value === "sem-site") return "Sem site";
  return "Todos";
}

function ProgressPill({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}>
      {value} {label}
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Campanhas() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const { data: leads } = useListLeads();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [activeMining, setActiveMining] = useState<ActiveMiningState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [form, setForm] = useState<CampaignFormState>(INITIAL_FORM);
  const [nomeTouched, setNomeTouched] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateCampaign();
  const deleteMutation = useDeleteCampaign();

  const selectedConversao = useMemo(() => getConversao(form.nicho), [form.nicho]);
  const conversionWidth = selectedConversao ? Math.max(10, (selectedConversao / MAX_CONVERSAO) * 100) : 0;
  const canChooseCity = form.mercado === "Internacional" ? Boolean(form.pais) : Boolean(form.uf);
  const leadsByCampaign = useMemo(() => {
    const grouped = new Map<number, CampaignLeadPreview[]>();

    for (const lead of leads ?? []) {
      if (!lead.campanhaId) continue;

      const current = grouped.get(lead.campanhaId) ?? [];
      current.push({
        id: lead.id,
        campanhaId: lead.campanhaId ?? null,
        nomeEmpresa: lead.nomeEmpresa,
        cidade: lead.cidade,
        uf: lead.uf,
        whatsapp: lead.whatsapp ?? null,
        temperatura: lead.temperatura,
        status: lead.status,
      });
      grouped.set(lead.campanhaId, current);
    }

    for (const [campaignId, items] of grouped.entries()) {
      grouped.set(
        campaignId,
        items.sort((a, b) => {
          const statusBoost = (a.status === "Novo" ? 0 : 1) - (b.status === "Novo" ? 0 : 1);
          if (statusBoost !== 0) return statusBoost;
          return a.nomeEmpresa.localeCompare(b.nomeEmpresa, "pt-BR");
        }),
      );
    }

    return grouped;
  }, [leads]);

  useEffect(() => {
    if (!activeMining) return;

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - activeMining.startedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [activeMining]);

  useEffect(() => {
    const unsubscribe = subscribeMiningSession((next) => {
      setIsMining(next.isMining);
      setActiveMining(next.activeMining);
      if (!next.activeMining) {
        setElapsedMs(0);
      }
    });

    const current = getMiningSessionSnapshot();
    setIsMining(current.isMining);
    setActiveMining(current.activeMining);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (nomeTouched) return;
    if (!form.nicho) {
      setForm((current) => ({ ...current, nome: "" }));
      return;
    }

    const local = form.mercado === "Internacional"
      ? [form.cidade, form.pais].filter(Boolean).join(" - ")
      : [form.cidade, form.uf].filter(Boolean).join(" - ");

    setForm((current) => ({
      ...current,
      nome: local ? `${current.nicho} - ${local}` : `${current.nicho} - ${current.mercado}`,
    }));
  }, [form.cidade, form.mercado, form.nicho, form.pais, form.uf, nomeTouched]);

  useEffect(() => {
    if (form.mercado !== "Nacional" || !form.uf) {
      setCityOptions([]);
      setIsLoadingCities(false);
      return;
    }

    const controller = new AbortController();

    async function loadCitiesByUf() {
      try {
        setIsLoadingCities(true);
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.uf}/municipios`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Falha ao carregar municipios");
        }

        const cities = (await response.json()) as Array<{ nome: string }>;
        setCityOptions(cities.map((city) => city.nome));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setCityOptions([]);
        toast({
          title: "Nao foi possivel carregar as cidades",
          description: "Tente selecionar a UF novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCities(false);
      }
    }

    loadCitiesByUf();

    return () => controller.abort();
  }, [form.mercado, form.uf, toast]);

  const refreshCampaignData = () => {
    queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setNomeTouched(false);
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleProspect = async (campaign: CampaignCardData) => {
    if (getMiningSessionSnapshot().isMining) {
      return;
    }

    try {
      const startedAt = Date.now();
      const result = await startCampaignMining(campaign);

      const elapsed = Date.now() - startedAt;
      const remainingFeedbackMs = Math.max(0, MIN_MINING_FEEDBACK_MS - elapsed);
      if (remainingFeedbackMs > 0) {
        await delay(remainingFeedbackMs);
      }

      toast({
        title: "Prospecao concluida",
        description: `${result.found} leads encontrados para ${campaign.nome}.`,
        variant: "success",
      });

      refreshCampaignData();
      clearMiningSession();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        refreshCampaignData();
        return;
      }

      if (error instanceof Error && error.message === "MINING_ALREADY_RUNNING") {
        toast({
          title: "Mineracao em andamento",
          description: "Ja existe uma campanha sendo prospectada agora.",
          variant: "destructive",
        });
        return;
      }

      clearMiningSession();
      toast({
        title: "Erro",
        description: "Falha ao prospectar esta campanha.",
        variant: "destructive",
      });
    }
  };

  const handleStopMining = () => {
    const stopped = stopCampaignMining();
    if (!stopped) {
      return;
    }

    refreshCampaignData();
    toast({
      title: "Prospecao interrompida",
      description: "A coleta foi parada e os leads ja salvos foram mantidos.",
      variant: "success",
    });
  };

  const handleDelete = async (campaign: CampaignCardData) => {
    if (!window.confirm(`Apagar a campanha "${campaign.nome}"?`)) return;

    try {
      await deleteMutation.mutateAsync({ id: campaign.id });
      refreshCampaignData();
      toast({
        title: "Campanha apagada",
        description: `${campaign.nome} foi removida com sucesso.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Nao foi possivel apagar a campanha agora.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cidade = form.cidade.trim();
    const pais = form.mercado === "Internacional" ? form.pais.trim() : "Brasil";
    const uf = form.mercado === "Internacional" ? pais : form.uf.trim().toUpperCase();
    const nome = form.nome.trim() || `${form.nicho} - ${cidade}`;

    if (!form.nicho || !cidade || (form.mercado === "Nacional" && !uf) || (form.mercado === "Internacional" && !pais)) {
      toast({
        title: "Campos pendentes",
        description: "Preencha mercado, nicho e a localizacao completa da campanha.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          nome,
          mercado: form.mercado,
          nicho: form.nicho,
          preferenciaSite: form.preferenciaSite,
          pais,
          cidade,
          uf,
        } as any,
      });

      toast({
        title: "Campanha criada",
        description: "A campanha foi criada. Clique em Prospectar quando quiser iniciar a coleta.",
        variant: "success",
      });

      refreshCampaignData();
      setIsModalOpen(false);
      resetForm();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao criar a campanha.",
        variant: "destructive",
      });
    }
  };

  const displayStage = activeMining ? getMiningStage(elapsedMs, activeMining.stage === "completed") : null;
  const progress = displayStage ? getMiningProgress(displayStage, elapsedMs) : 0;
  const activeMiningCampaignMissing = Boolean(
    activeMining && campaigns?.every((campaign) => campaign.id !== activeMining.campaignId),
  );

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Campanhas</h1>
            <p className="mt-1 text-muted-foreground">Crie a campanha primeiro e prospecte quando quiser iniciar a mineracao.</p>
          </div>
          <Button onClick={openModal} className="gap-2">
            <Plus className="h-5 w-5" /> Nova Campanha
          </Button>
        </div>

        {isLoading ? (
          <div className="grid auto-rows-max grid-cols-1 items-start gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="h-48 animate-pulse bg-card/50" />
            ))}
          </div>
        ) : campaigns?.length === 0 && !activeMining ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-bold text-white">Nenhuma campanha</h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              Crie sua primeira campanha e depois clique em Prospectar para iniciar a mineracao de leads.
            </p>
            <Button onClick={openModal}>Criar Primeira Campanha</Button>
          </div>
        ) : (
          <div className="grid auto-rows-max grid-cols-1 items-start gap-6 xl:grid-cols-2 2xl:grid-cols-3">
            {activeMining && displayStage && activeMiningCampaignMissing && (
              <Card className="h-fit self-start border-primary/30 bg-card/90 p-5 shadow-[0_0_0_1px_rgba(168,85,247,0.10)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-lg font-bold text-white">{activeMining.nome}</h3>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>{getLocationLabel(activeMining.cidade, activeMining.uf, activeMining.pais, activeMining.mercado)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-amber-400" />
                        <span>{activeMining.nicho}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe2 className="h-3 w-3 text-sky-400" />
                        <span>{activeMining.mercado}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-sky-400" />
                        <span>{activeMining.foundLeads} leads confirmados</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={displayStage === "completed" ? "success" : "warning"}>
                    {displayStage === "completed" ? "Concluida" : "Coletando"}
                  </Badge>
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-white">
                      {displayStage === "collecting" && <Search className="h-4 w-4 text-primary" />}
                      {displayStage === "validating" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                      {displayStage === "saving" && <Database className="h-4 w-4 text-amber-400" />}
                      {displayStage === "completed" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                      <span className="font-medium">{getStageLabel(displayStage)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatElapsed(elapsedMs)}</span>
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400 transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{getStageHint(displayStage, elapsedMs)}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ProgressPill value={String(activeMining.foundLeads)} label="novos" tone="border-rose-400/20 bg-rose-400/10 text-rose-300" />
                    <ProgressPill
                      value={String(activeMining.whatsappLeads)}
                      label="com WhatsApp"
                      tone="border-amber-400/20 bg-amber-400/10 text-amber-300"
                    />
                    <ProgressPill
                      value={String(activeMining.verifiedWhatsappLeads)}
                      label="validados"
                      tone="border-sky-400/20 bg-sky-400/10 text-sky-300"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Button type="button" variant="outline" className="w-full gap-2" disabled>
                    <Loader2 className={`h-4 w-4 ${displayStage === "completed" ? "" : "animate-spin"}`} />
                    {displayStage === "completed" ? "Finalizado" : "Processando..."}
                  </Button>
                  <Button type="button" className="w-full gap-2 bg-orange-600 text-white hover:bg-orange-500" disabled>
                    <Pause className="h-4 w-4" />
                    Pausar
                  </Button>
                  <Button type="button" className="w-full gap-2 bg-red-600 text-white hover:bg-red-500" onClick={handleStopMining}>
                    <Square className="h-4 w-4" />
                    Parar
                  </Button>
                </div>
              </Card>
            )}

            {campaigns?.map((campaign) => {
              const campaignData = campaign as CampaignCardData;
              const badge = getCampaignBadge(campaignData);
              const taxa = campaignData.taxaConversao ?? getConversao(campaignData.nicho) ?? 0;
              const isThisCampaignMining = activeMining?.campaignId === campaignData.id;

              return (
                <Card
                  key={campaignData.id}
                  className={`flex flex-col p-6 transition-colors hover:border-primary/30 ${
                    isThisCampaignMining ? "h-fit self-start border-primary/30 bg-card/90 shadow-[0_0_0_1px_rgba(168,85,247,0.10)]" : "h-fit self-start"
                  }`}
                >
                  <div className="mb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-lg font-bold text-white xl:text-[1.35rem]" title={campaignData.nome}>{campaignData.nome}</h3>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-rose-400" />
                            <span>{getLocationLabel(campaignData.cidade, campaignData.uf, campaignData.pais ?? null, campaignData.mercado)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-amber-400" />
                            <span>{campaignData.nicho}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-violet-400" />
                            <span>{campaignData.totalLeads} leads</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            <span>{campaignData.leadsContatados ?? 0} contatados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe2 className="h-3 w-3 text-emerald-400" />
                            <span>{getSitePreferenceLabel(campaignData.preferenciaSite)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span>{taxa ? `${taxa}% de potencial` : "Potencial em analise"}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={isThisCampaignMining ? "warning" : badge.variant}>
                        {isThisCampaignMining ? "Coletando" : badge.label}
                      </Badge>
                    </div>

                    {isThisCampaignMining && activeMining && displayStage ? (
                      <div className="mt-4">
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-white">
                              {displayStage === "collecting" && <Search className="h-4 w-4 text-primary" />}
                              {displayStage === "validating" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                              {displayStage === "saving" && <Database className="h-4 w-4 text-amber-400" />}
                              {displayStage === "completed" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                              <span className="font-medium">{getStageLabel(displayStage)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>{formatElapsed(elapsedMs)}</span>
                            </div>
                          </div>

                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400 transition-[width] duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{getStageHint(displayStage, elapsedMs)}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ProgressPill value={String(activeMining.foundLeads)} label="novos" tone="border-rose-400/20 bg-rose-400/10 text-rose-300" />
                            <ProgressPill value={String(activeMining.whatsappLeads)} label="com WhatsApp" tone="border-amber-400/20 bg-amber-400/10 text-amber-300" />
                            <ProgressPill value={String(activeMining.verifiedWhatsappLeads)} label="validados" tone="border-sky-400/20 bg-sky-400/10 text-sky-300" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Potencial de conversao</span>
                            <span className={`font-semibold ${conversaoBadgeColor(taxa)}`.split(" ")[0]}>{taxa ? `${taxa}%` : "-"}</span>
                          </div>
                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300"
                              style={{ width: `${Math.max(8, (taxa / MAX_CONVERSAO) * 100)}%` }}
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-xs font-semibold text-rose-300">
                              0 novos
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              {campaignData.leadsContatados ?? 0} contatados
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
                              0 com WhatsApp
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-xs font-semibold text-sky-300">
                              {campaignData.totalLeads} validados
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {isThisCampaignMining && activeMining && displayStage ? (
                    <>
                      <div className="mb-4 rounded-2xl border border-border/60 bg-background/40 p-4 xl:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-white">
                            {displayStage === "collecting" && <Search className="h-4 w-4 text-primary" />}
                            {displayStage === "validating" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                            {displayStage === "saving" && <Database className="h-4 w-4 text-amber-400" />}
                            {displayStage === "completed" && <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                            <span className="font-medium">{getStageLabel(displayStage)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>{formatElapsed(elapsedMs)}</span>
                          </div>
                        </div>

                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary via-amber-400 to-emerald-400 transition-[width] duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{getStageHint(displayStage, elapsedMs)}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <ProgressPill value={String(activeMining.foundLeads)} label="novos" tone="border-rose-400/20 bg-rose-400/10 text-rose-300" />
                          <ProgressPill value={String(activeMining.whatsappLeads)} label="com WhatsApp" tone="border-amber-400/20 bg-amber-400/10 text-amber-300" />
                          <ProgressPill value={String(activeMining.verifiedWhatsappLeads)} label="validados" tone="border-sky-400/20 bg-sky-400/10 text-sky-300" />
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div className={`mt-auto border-t border-border/50 pt-5 ${isThisCampaignMining ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] sm:items-center"}`}>
                    <Link href={`/leads?campanhaId=${campaignData.id}`} className="min-w-0">
                      <Button type="button" variant="outline" className="w-full" disabled={isThisCampaignMining}>
                        Ver Leads
                      </Button>
                    </Link>

                    <Button
                      type="button"
                      className="w-full gap-2"
                      disabled={isMining}
                      onClick={() => handleProspect(campaignData)}
                    >
                      {isThisCampaignMining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      {isThisCampaignMining ? "Processando..." : "Prospectar"}
                    </Button>

                    {isThisCampaignMining ? (
                      <Button type="button" className="w-full gap-2 bg-red-600 text-white hover:bg-red-500 sm:col-span-2" onClick={handleStopMining}>
                        <Square className="h-4 w-4" />
                        Parar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 px-3 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                        disabled={isMining || deleteMutation.isPending}
                        onClick={() => handleDelete(campaignData)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {!isThisCampaignMining && campaignData.totalLeads > 0 ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-background/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Leads da campanha</p>
                          <p className="text-xs text-muted-foreground">
                            {campaignData.totalLeads} captados, {campaignData.leadsContatados ?? 0} ja contatados
                          </p>
                        </div>
                        <Link href={`/leads?campanhaId=${campaignData.id}`}>
                          <Button type="button" variant="outline" size="sm" className="gap-1.5">
                            Ver todos
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>

                      <div className="space-y-2">
                        {(leadsByCampaign.get(campaignData.id) ?? []).slice(0, 3).map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-black/10 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-white">{lead.nomeEmpresa}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {lead.cidade}, {lead.uf}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] font-semibold text-emerald-300">{lead.whatsapp ? "WhatsApp" : "Sem WhatsApp"}</p>
                              <p className="text-[11px] text-muted-foreground">{lead.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                    {format(new Date(campaignData.dataCriacao), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Campanha">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Mercado</label>
              <div className="grid grid-cols-2 gap-3">
                {(["Nacional", "Internacional"] as Mercado[]).map((mercado) => (
                  <button
                    key={mercado}
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      mercado,
                      uf: mercado === "Internacional" ? "" : current.uf,
                      pais: mercado === "Internacional" ? current.pais || "Portugal" : "Brasil",
                      cidade: "",
                    }))}
                    className={`h-11 rounded-xl border text-sm font-semibold transition-all ${
                      form.mercado === mercado
                        ? "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(96,165,250,0.25)]"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-white"
                    }`}
                  >
                    {mercado}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nicho</label>
              <Select
                value={form.nicho}
                onChange={(event) => setForm((current) => ({ ...current, nicho: event.target.value }))}
              >
                <option value="">Selecione o nicho</option>
                {NICHOS.map((nicho) => (
                  <option key={nicho.nome} value={nicho.nome}>
                    {nicho.nome} - {nicho.conversao}% conversao
                  </option>
                ))}
              </Select>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Taxa historica de conversao</span>
                  <span className="font-semibold text-rose-300">{selectedConversao ? `${selectedConversao}%` : "0%"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 transition-[width] duration-300"
                    style={{ width: `${conversionWidth}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Tipo de cliente</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: "todos", label: "Todos" },
                  { value: "com-site", label: "Com site" },
                  { value: "sem-site", label: "Sem site" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, preferenciaSite: option.value }))}
                    className={`h-11 rounded-xl border text-sm font-semibold transition-all ${
                      form.preferenciaSite === option.value
                        ? "border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(96,165,250,0.25)]"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Escolha se a mineracao deve priorizar empresas com site, sem site ou ambas.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {form.mercado === "Internacional" ? "Pais" : "Estado"}
                </label>
                {form.mercado === "Internacional" ? (
                  <Select
                    value={form.pais}
                    onChange={(event) => setForm((current) => ({ ...current, pais: event.target.value, cidade: "" }))}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </Select>
                ) : (
                  <Select
                    value={form.uf}
                    onChange={(event) => setForm((current) => ({ ...current, uf: event.target.value, cidade: "" }))}
                  >
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">Cidade</label>
                {form.mercado === "Internacional" ? (
                  <Input
                    value={form.cidade}
                    onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))}
                    disabled={!canChooseCity}
                    placeholder={canChooseCity ? "Ex: Lisboa" : "Selecione o pais primeiro"}
                  />
                ) : (
                  <Select
                    value={form.cidade}
                    onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))}
                    disabled={!canChooseCity || isLoadingCities}
                  >
                    <option value="">
                      {!form.uf
                        ? "Selecione o estado primeiro"
                        : isLoadingCities
                          ? "Carregando cidades..."
                          : "Selecione a cidade"}
                    </option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nome da Campanha</label>
              <Input
                value={form.nome}
                onChange={(event) => {
                  setNomeTouched(true);
                  setForm((current) => ({ ...current, nome: event.target.value }));
                }}
                placeholder="Preenchido automaticamente"
              />
              <p className="mt-1 text-xs text-muted-foreground">Voce pode criar agora e prospectar depois.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Criar Campanha
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
