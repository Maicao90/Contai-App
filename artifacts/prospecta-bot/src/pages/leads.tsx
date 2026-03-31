import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardStatsQueryKey,
  getListLeadsQueryKey,
  ListLeadsStatus,
  useListCampaigns,
  useListLeads,
  useUpdateLead,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Badge, Button, Card, Input, Select } from "@/components/ui/shared";
import { useToast } from "@/hooks/use-toast";
import { NICHOS, conversaoBadgeColor, getConversao } from "@/lib/nichos";
import { buildCanonicalWhatsappUrl, formatBrazilianContact } from "@/lib/whatsapp";
import {
  ArrowRight,
  Filter,
  Flame,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Snowflake,
  ThermometerSun,
  TrendingUp,
} from "lucide-react";

type UiLeadStatus = ListLeadsStatus | "Perdido" | "Ignorado";

const LEADS_RETURN_URL_KEY = "prospecta.leads.returnUrl";
const LEADS_RETURN_SCROLL_KEY = "prospecta.leads.returnScroll";

function formatContactLabel(value: string | null | undefined): string | null {
  return formatBrazilianContact(value);
}

function getStatusPriority(status: string): number {
  if (status === "Novo") return 0;
  if (status === "Convertido") return 1;
  if (status === "Perdido") return 2;
  if (status === "Ignorado") return 3;
  if (status === "Contatado") return 4;
  return 5;
}

function getScoreTone(score: number) {
  if (score >= 70) {
    return {
      text: "text-rose-300",
      bar: "bg-gradient-to-r from-rose-500 to-red-400",
      chip: "border-rose-400/20 bg-rose-400/10",
    };
  }

  if (score >= 35) {
    return {
      text: "text-amber-300",
      bar: "bg-gradient-to-r from-amber-500 to-orange-400",
      chip: "border-amber-400/20 bg-amber-400/10",
    };
  }

  return {
    text: "text-sky-300",
    bar: "bg-gradient-to-r from-sky-500 to-blue-400",
    chip: "border-sky-400/20 bg-sky-400/10",
  };
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  if (temperature === "Quente") {
    return (
      <Badge variant="danger" className="gap-1 px-2.5 py-1">
        <Flame className="h-3 w-3" />
        Quente
      </Badge>
    );
  }

  if (temperature === "Morno") {
    return (
      <Badge variant="warning" className="gap-1 px-2.5 py-1">
        <ThermometerSun className="h-3 w-3" />
        Morno
      </Badge>
    );
  }

  return (
    <Badge variant="info" className="gap-1 px-2.5 py-1">
      <Snowflake className="h-3 w-3" />
      Frio
    </Badge>
  );
}

function ContactCard({
  icon,
  title,
  label,
  sublabel,
  emptyLabel,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  label: string | null;
  sublabel?: string;
  emptyLabel: string;
  tone: "phone" | "whatsapp" | "email";
}) {
  const styles =
    tone === "phone"
      ? "border-sky-500/20 bg-sky-500/10 text-sky-100"
      : tone === "whatsapp"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
        : "border-violet-500/20 bg-violet-500/10 text-violet-100";

  return (
    <div className="space-y-1.5 rounded-2xl border border-border/60 bg-background/30 p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {title}
      </div>
      {label ? (
        <>
          <div className={`rounded-2xl border px-3 py-2.5 text-[13px] font-semibold tracking-tight ${styles}`}>
            <span className="break-all">{label}</span>
          </div>
          {sublabel ? <div className="text-[11px] font-semibold text-amber-300">{sublabel}</div> : null}
        </>
      ) : (
        <div className="py-2.5 text-[13px] text-muted-foreground/55">{emptyLabel}</div>
      )}
    </div>
  );
}

export default function Leads() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [filters, setFilters] = useState({
    campanhaId: searchParams.get("campanhaId") || "",
    status: searchParams.get("status") || "",
    temperatura: searchParams.get("temperatura") || "",
    nicho: searchParams.get("nicho") || "",
    busca: "",
  });
  const [pendingStatuses, setPendingStatuses] = useState<Record<number, UiLeadStatus>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: campaigns } = useListCampaigns();
  const campaignsById = useMemo(() => {
    return new Map(
      (campaigns ?? []).map((campaign) => [
        campaign.id,
        (campaign as { preferenciaSite?: "todos" | "com-site" | "sem-site" }).preferenciaSite ?? "todos",
      ]),
    );
  }, [campaigns]);

  const apiParams: Record<string, unknown> = {};
  if (filters.campanhaId) apiParams.campanhaId = Number.parseInt(filters.campanhaId, 10);
  if (filters.status) apiParams.status = filters.status;
  if (filters.temperatura) apiParams.temperatura = filters.temperatura;
  if (filters.nicho) apiParams.nicho = filters.nicho;

  const { data: allLeads, isLoading } = useListLeads(apiParams as any);

  const filteredLeads = useMemo(() => {
    return (allLeads ?? [])
      .map((lead, index) => ({
        lead: pendingStatuses[lead.id]
          ? { ...lead, status: pendingStatuses[lead.id] }
          : lead,
        index,
      }))
      .filter(({ lead }) => {
        const campaignPreference =
          (lead.campanhaId ? campaignsById.get(lead.campanhaId) : null) ?? "todos";
        const isSemSiteCampaign = campaignPreference === "sem-site";

        if (isSemSiteCampaign) {
          const hasUsableContact = Boolean(
            lead.whatsapp &&
              lead.whatsappVerificado &&
              buildCanonicalWhatsappUrl(lead.whatsapp),
          );

          if (!hasUsableContact) return false;
        } else {
          if (!lead.whatsapp || !lead.whatsappVerificado) return false;
          if (!buildCanonicalWhatsappUrl(lead.whatsapp)) return false;
        }

        if (!filters.busca) return true;
        const term = filters.busca.toLowerCase();
        return (
          lead.nomeEmpresa.toLowerCase().includes(term) ||
          lead.nicho.toLowerCase().includes(term) ||
          lead.cidade.toLowerCase().includes(term) ||
          (lead.telefone ?? "").toLowerCase().includes(term) ||
          (lead.email ?? "").toLowerCase().includes(term) ||
          (lead.whatsapp ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const statusOrder = getStatusPriority(a.lead.status) - getStatusPriority(b.lead.status);
        if (statusOrder !== 0) return statusOrder;
        return a.index - b.index;
      })
      .map(({ lead }) => lead);
  }, [allLeads, campaignsById, filters.busca, pendingStatuses]);

  const totalWithPhone = filteredLeads.filter((lead) => Boolean(lead.telefone)).length;
  const totalWithWhatsapp = filteredLeads.filter((lead) => Boolean(lead.whatsapp)).length;
  const totalVerifiedWhatsapp = filteredLeads.filter((lead) => lead.whatsappVerificado).length;
  const hasInternationalLeads = filteredLeads.some((lead) => (lead.uf ?? "").length > 2);

  const updateMutation = useUpdateLead({
    mutation: {
      onSuccess: (_, variables) => {
        const nextStatus = variables.data?.status as UiLeadStatus | undefined;
        if (nextStatus) {
          setPendingStatuses((current) => {
            const next = { ...current };
            delete next[variables.id];
            return next;
          });
        }
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Status atualizado!", variant: "success" });
      },
      onError: (_, variables) => {
        setPendingStatuses((current) => {
          const next = { ...current };
          delete next[variables.id];
          return next;
        });
      },
    },
  });

  const handleStatusChange = (id: number, status: UiLeadStatus) => {
    setPendingStatuses((current) => ({ ...current, [id]: status }));
    updateMutation.mutate({ id, data: { status: status as any } });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.campanhaId) params.set("campanhaId", filters.campanhaId);
    if (filters.status) params.set("status", filters.status);
    if (filters.temperatura) params.set("temperatura", filters.temperatura);
    if (filters.nicho) params.set("nicho", filters.nicho);
    if (filters.busca) params.set("busca", filters.busca);

    const nextUrl = `/leads${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [filters]);

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    const savedUrl = window.sessionStorage.getItem(LEADS_RETURN_URL_KEY);
    const savedScroll = window.sessionStorage.getItem(LEADS_RETURN_SCROLL_KEY);

    if (savedUrl !== currentUrl || !savedScroll) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: Number(savedScroll), behavior: "auto" });
      window.sessionStorage.removeItem(LEADS_RETURN_SCROLL_KEY);
    });
  }, []);

  const openLeadDetail = (leadId: number) => {
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(LEADS_RETURN_URL_KEY, currentUrl);
    window.sessionStorage.setItem(LEADS_RETURN_SCROLL_KEY, String(window.scrollY));
    navigate(`/leads/${leadId}`);
  };

  return (
    <Layout>
      <div className="flex h-full flex-col space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Leads</h1>
          <p className="mt-1 text-muted-foreground">Lista acionavel: apenas empresas com WhatsApp validado e prontas para receber mensagem.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Leads acionaveis</p>
            <p className="mt-2 text-3xl font-bold text-white">{filteredLeads.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">{totalWithPhone} com telefone visivel</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">WhatsApp validado</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{totalWithWhatsapp}</p>
            <p className="mt-1 text-sm text-muted-foreground">{totalVerifiedWhatsapp} prontos para contato</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Campanhas ativas no filtro</p>
            <p className="mt-2 text-3xl font-bold text-primary">{filters.campanhaId ? 1 : campaigns?.length ?? 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Use os filtros para afunilar sua operacao</p>
          </Card>
        </div>

        <Card className="shrink-0 space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, numero, nicho ou cidade..."
              className="pl-9"
              value={filters.busca}
              onChange={(event) => setFilters((current) => ({ ...current, busca: event.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

            <Select
              value={filters.campanhaId}
              onChange={(event) => setFilters((current) => ({ ...current, campanhaId: event.target.value }))}
              className="max-w-[220px] min-w-[150px] flex-1"
            >
              <option value="">Todas Campanhas</option>
              {campaigns?.map((campaign) => (
                <option key={campaign.id} value={campaign.id.toString()}>{campaign.nome}</option>
              ))}
            </Select>

            <Select
              value={filters.nicho}
              onChange={(event) => setFilters((current) => ({ ...current, nicho: event.target.value }))}
              className="max-w-[220px] min-w-[170px] flex-1"
            >
              <option value="">Todos os Nichos</option>
              {NICHOS.map((nicho) => (
                <option key={nicho.nome} value={nicho.nome}>
                  {nicho.nome} - {nicho.conversao}%
                </option>
              ))}
            </Select>

            <Select
              value={filters.temperatura}
              onChange={(event) => setFilters((current) => ({ ...current, temperatura: event.target.value }))}
              className="max-w-[160px] min-w-[130px] flex-1"
            >
              <option value="">Qualquer Temp.</option>
              <option value="Quente">Quente</option>
              <option value="Morno">Morno</option>
              <option value="Frio">Frio</option>
            </Select>

            <Select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="max-w-[160px] min-w-[130px] flex-1"
            >
              <option value="">Qualquer Status</option>
              <option value="Novo">Novo</option>
              <option value="Contatado">Contatado</option>
              <option value="Convertido">Convertido</option>
              <option value="Perdido">Perdido</option>
              <option value="Ignorado">Ignorado</option>
            </Select>

            {(filters.nicho || filters.status || filters.temperatura || filters.campanhaId || filters.busca) && (
              <button
                onClick={() => setFilters({ campanhaId: "", status: "", temperatura: "", nicho: "", busca: "" })}
                className="whitespace-nowrap rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,2.1fr)_minmax(170px,0.85fr)_minmax(190px,1fr)_120px_180px_170px] lg:items-center">
                  <div className="space-y-2">
                    <div className="h-8 w-72 rounded-xl bg-muted" />
                    <div className="h-5 w-48 rounded-lg bg-muted" />
                  </div>
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                </div>
              </Card>
            ))
          ) : filteredLeads.length === 0 ? (
            <Card className="px-6 py-16 text-center text-muted-foreground">
              <Search className="mx-auto mb-3 h-8 w-8 opacity-20" />
              Nenhum lead com WhatsApp validado encontrado com estes filtros.
            </Card>
          ) : (
            filteredLeads.map((lead) => {
              const scoreTone = getScoreTone(lead.score);
              const phoneLabel = formatContactLabel(lead.telefone);
              const whatsappLabel = formatContactLabel(lead.whatsapp);
              const leadStatus = lead.status as UiLeadStatus;
              const nicheConversion = getConversao(lead.nicho);

              return (
                <div
                  key={lead.id}
                  className="group cursor-pointer"
                  onClick={() => openLeadDetail(lead.id)}
                >
                <Card className="p-4 transition-colors hover:border-primary/30 hover:bg-white/[0.02]">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,2.1fr)_minmax(170px,0.85fr)_minmax(190px,1fr)_120px_180px_170px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="pt-1 text-[14px] leading-none text-primary/40">.</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[18px] font-bold leading-tight text-white transition-colors group-hover:text-primary">
                            {lead.nomeEmpresa}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {lead.cidade}, {lead.uf}
                            </span>
                            {nicheConversion ? (
                              <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${conversaoBadgeColor(nicheConversion)}`}>
                                <TrendingUp className="h-3 w-3" />
                                {nicheConversion}% conv.
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full bg-background/60 px-3 py-1 text-[11px]">
                              {lead.nicho}
                            </Badge>
                            <TemperatureBadge temperature={lead.temperatura} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5">
                      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/80">
                        <Phone className="h-3.5 w-3.5 text-sky-400" />
                        Telefone
                      </div>
                      <div className="text-[15px] font-semibold text-sky-50">{phoneLabel ?? "Sem telefone"}</div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
                      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                        WhatsApp
                      </div>
                      <div className="text-[15px] font-semibold text-emerald-50">{whatsappLabel ?? "Sem WhatsApp"}</div>
                      <div className="mt-1 text-[11px] font-semibold text-amber-300">{lead.whatsappVerificado ? "Validado" : "Nao validado"}</div>
                      {hasInternationalLeads && lead.email ? <div className="mt-1 truncate text-[11px] text-emerald-100/70">{lead.email}</div> : null}
                    </div>

                    <div className={`rounded-xl border px-3 py-2.5 ${scoreTone.chip}`}>
                      <div className="flex items-end justify-between gap-2">
                        <span className={`text-[18px] font-bold leading-none ${scoreTone.text}`}>{lead.score}</span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
                        <div className={`h-full rounded-full ${scoreTone.bar}`} style={{ width: `${lead.score}%` }} />
                      </div>
                    </div>

                    <div
                      className="min-w-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Select
                        value={lead.status}
                        onChange={(event) => handleStatusChange(lead.id, event.target.value as UiLeadStatus)}
                        className={`h-11 w-full border-0 px-3 py-1 text-xs font-semibold ${
                          leadStatus === "Convertido" ? "bg-emerald-500/10 text-emerald-400" :
                          leadStatus === "Contatado" ? "bg-blue-500/10 text-blue-400" :
                          leadStatus === "Perdido" ? "bg-rose-500/10 text-rose-400" :
                          leadStatus === "Ignorado" ? "bg-zinc-500/10 text-zinc-400" :
                          "bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        <option value="Novo" className="bg-background text-foreground">Novo</option>
                        <option value="Contatado" className="bg-background text-foreground">Contatado</option>
                        <option value="Convertido" className="bg-background text-foreground">Convertido</option>
                        <option value="Perdido" className="bg-background text-foreground">Perdido</option>
                        <option value="Ignorado" className="bg-background text-foreground">Ignorado</option>
                      </Select>
                    </div>

                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl border-border/70 px-4 group-hover:border-primary/50 group-hover:bg-primary/10 lg:w-auto"
                        onClick={(event) => {
                          event.stopPropagation();
                          openLeadDetail(lead.id);
                        }}
                      >
                        Ver detalhes <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
