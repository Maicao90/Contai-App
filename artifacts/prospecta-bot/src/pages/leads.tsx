import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Badge, Select, Button, Input } from "@/components/ui/shared";
import { 
  useListLeads, 
  useUpdateLead,
  useListCampaigns,
  getListLeadsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { ListLeadsStatus, ListLeadsTemperatura } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Phone, ArrowRight, Activity, ThermometerSun, Flame, Snowflake, TrendingUp } from "lucide-react";
import { getConversao, conversaoBadgeColor, NICHOS } from "@/lib/nichos";

export default function Leads() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    campanhaId: searchParams.get('campanhaId') || "",
    status: searchParams.get('status') || "",
    temperatura: searchParams.get('temperatura') || "",
    nicho: searchParams.get('nicho') || "",
    busca: "",
  });

  // Queries
  const { data: campaigns } = useListCampaigns();
  
  // Clean empty params for API call
  const apiParams: any = {};
  if (filters.campanhaId) apiParams.campanhaId = parseInt(filters.campanhaId);
  if (filters.status)     apiParams.status = filters.status;
  if (filters.temperatura) apiParams.temperatura = filters.temperatura;
  if (filters.nicho)      apiParams.nicho = filters.nicho;
  
  const { data: allLeads, isLoading } = useListLeads(apiParams);
  
  const filteredLeads = allLeads?.filter(lead => {
    if (!filters.busca) return true;
    const term = filters.busca.toLowerCase();
    return lead.nomeEmpresa.toLowerCase().includes(term) || 
           lead.nicho.toLowerCase().includes(term) ||
           lead.cidade.toLowerCase().includes(term);
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Status atualizado!", variant: "success" });
      }
    }
  });

  const handleStatusChange = (id: number, status: ListLeadsStatus) => {
    updateMutation.mutate({ id, data: { status } });
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu pipeline de prospecção e faça abordagens.</p>
        </div>

        <Card className="p-4 space-y-3 shrink-0">
          {/* Search row */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por empresa, nicho ou cidade..." 
              className="pl-9"
              value={filters.busca}
              onChange={e => setFilters(f => ({ ...f, busca: e.target.value }))}
            />
          </div>
          
          {/* Filter chips row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            
            <Select 
              value={filters.campanhaId} 
              onChange={e => setFilters(f => ({ ...f, campanhaId: e.target.value }))}
              className="min-w-[150px] flex-1 max-w-[200px]"
            >
              <option value="">Todas Campanhas</option>
              {campaigns?.map(c => <option key={c.id} value={c.id.toString()}>{c.nome}</option>)}
            </Select>

            <Select 
              value={filters.nicho} 
              onChange={e => setFilters(f => ({ ...f, nicho: e.target.value }))}
              className="min-w-[170px] flex-1 max-w-[220px]"
            >
              <option value="">Todos os Nichos</option>
              {NICHOS.map(n => (
                <option key={n.nome} value={n.nome}>
                  {n.nome} — {n.conversao}%
                </option>
              ))}
            </Select>

            <Select 
              value={filters.temperatura} 
              onChange={e => setFilters(f => ({ ...f, temperatura: e.target.value }))}
              className="min-w-[130px] flex-1 max-w-[160px]"
            >
              <option value="">Qualquer Temp.</option>
              <option value="Quente">🔴 Quente</option>
              <option value="Morno">🟡 Morno</option>
              <option value="Frio">🔵 Frio</option>
            </Select>

            <Select 
              value={filters.status} 
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="min-w-[130px] flex-1 max-w-[160px]"
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
                className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-border/50 hover:border-border transition-colors whitespace-nowrap"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background/80 backdrop-blur-sm text-muted-foreground sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Empresa</th>
                  <th className="px-6 py-4 font-medium">Contato</th>
                  <th className="px-6 py-4 font-medium">Oportunidade</th>
                  <th className="px-6 py-4 font-medium">Temperatura</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 bg-muted rounded w-48" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-muted rounded-xl w-12" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-muted rounded-full w-16" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-muted rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-muted rounded w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredLeads?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      Nenhum lead encontrado com estes filtros.
                    </td>
                  </tr>
                ) : (
                  filteredLeads?.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <td className="px-6 py-3">
                        <div className="font-semibold text-white group-hover:text-primary transition-colors">{lead.nomeEmpresa}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{lead.cidade}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <Badge variant="outline" className="text-[10px] py-0">{lead.nicho}</Badge>
                          {(() => {
                            const taxa = getConversao(lead.nicho);
                            if (!taxa) return null;
                            return (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${conversaoBadgeColor(taxa)}`}>
                                <TrendingUp className="w-2.5 h-2.5" />
                                {taxa}% conv.
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {lead.telefone ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {lead.telefone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1 min-w-[80px]">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${lead.score >= 70 ? 'text-red-400' : lead.score >= 35 ? 'text-amber-400' : 'text-blue-400'}`}>
                              {lead.score}
                            </span>
                            <span className="text-[10px] text-muted-foreground">/100</span>
                          </div>
                          <div className="w-full bg-background/80 rounded-full h-1.5 overflow-hidden border border-border/50">
                            <div
                              className={`h-full rounded-full transition-all ${lead.score >= 70 ? 'bg-red-500' : lead.score >= 35 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={lead.temperatura === 'Quente' ? 'danger' : lead.temperatura === 'Morno' ? 'warning' : 'info'} className="gap-1 px-2.5 py-1">
                          {lead.temperatura === 'Quente' ? <Flame className="w-3 h-3" /> : lead.temperatura === 'Morno' ? <ThermometerSun className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
                          {lead.temperatura}
                        </Badge>
                      </td>
                      <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                        <Select 
                          value={lead.status} 
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as ListLeadsStatus)}
                          className={`h-9 py-1 px-3 text-xs w-auto min-w-[130px] font-medium border-0 ${
                            lead.status === 'Convertido' ? 'bg-emerald-500/10 text-emerald-400' :
                            lead.status === 'Contatado'  ? 'bg-blue-500/10 text-blue-400' :
                            lead.status === 'Perdido'    ? 'bg-red-500/10 text-red-400' :
                            lead.status === 'Ignorado'   ? 'bg-zinc-500/10 text-zinc-400' :
                            'bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          <option value="Novo"       className="bg-background text-foreground">Novo</option>
                          <option value="Contatado"  className="bg-background text-foreground">Contatado</option>
                          <option value="Convertido" className="bg-background text-foreground">Convertido</option>
                          <option value="Perdido"    className="bg-background text-foreground">Perdido</option>
                          <option value="Ignorado"   className="bg-background text-foreground">Ignorado</option>
                        </Select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="group-hover:border-primary/50 group-hover:bg-primary/10"
                          onClick={e => { e.stopPropagation(); navigate(`/leads/${lead.id}`); }}
                        >
                          Ver <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </Layout>
  );
}
