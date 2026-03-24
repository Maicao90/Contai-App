import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, Badge, Select, Button, Input } from "@/components/ui/shared";
import { MessageModal } from "@/components/message-modal";
import { 
  useListLeads, 
  useUpdateLead,
  useListCampaigns,
  getListLeadsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { Lead, ListLeadsStatus, ListLeadsTemperatura } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Phone, ArrowRight, Activity, ThermometerSun } from "lucide-react";

export default function Leads() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    campanhaId: searchParams.get('campanhaId') || "",
    status: searchParams.get('status') || "",
    temperatura: searchParams.get('temperatura') || "",
    busca: "",
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Queries
  const { data: campaigns } = useListCampaigns();
  
  // Clean empty params for API call
  const apiParams: any = {};
  if (filters.campanhaId) apiParams.campanhaId = parseInt(filters.campanhaId);
  if (filters.status) apiParams.status = filters.status;
  if (filters.temperatura) apiParams.temperatura = filters.temperatura;
  
  // We do client-side text filtering for "busca" since API doesn't have a generic text search param
  // (API has nicho/cidade, but a unified search is better UX)
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

        <Card className="p-4 flex flex-col md:flex-row gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por empresa, nicho ou cidade..." 
              className="pl-9"
              value={filters.busca}
              onChange={e => setFilters(f => ({ ...f, busca: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden md:block" />
            
            <Select 
              value={filters.campanhaId} 
              onChange={e => setFilters(f => ({ ...f, campanhaId: e.target.value }))}
              className="min-w-[160px]"
            >
              <option value="">Todas Campanhas</option>
              {campaigns?.map(c => <option key={c.id} value={c.id.toString()}>{c.nome}</option>)}
            </Select>

            <Select 
              value={filters.temperatura} 
              onChange={e => setFilters(f => ({ ...f, temperatura: e.target.value }))}
              className="min-w-[140px]"
            >
              <option value="">Qualquer Temp.</option>
              <option value="Quente">Quente</option>
              <option value="Morno">Morno</option>
              <option value="Frio">Frio</option>
            </Select>

            <Select 
              value={filters.status} 
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="min-w-[140px]"
            >
              <option value="">Qualquer Status</option>
              <option value="Novo">Novo</option>
              <option value="Contatado">Contatado</option>
              <option value="Convertido">Convertido</option>
            </Select>
          </div>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background/80 backdrop-blur-sm text-muted-foreground sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Empresa</th>
                  <th className="px-6 py-4 font-medium">Contato</th>
                  <th className="px-6 py-4 font-medium">Score</th>
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
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-3">
                        <div className="font-semibold text-white group-hover:text-primary transition-colors">{lead.nomeEmpresa}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{lead.cidade}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <Badge variant="outline" className="text-[10px] py-0">{lead.nicho}</Badge>
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
                        <div className="bg-background/80 border border-border inline-flex items-center justify-center w-10 h-10 rounded-xl font-display font-bold text-white shadow-inner">
                          {lead.score}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={lead.temperatura === 'Quente' ? 'danger' : lead.temperatura === 'Morno' ? 'warning' : 'info'} className="gap-1 px-2.5 py-1">
                          {lead.temperatura === 'Quente' ? <Flame className="w-3 h-3" /> : lead.temperatura === 'Morno' ? <ThermometerSun className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
                          {lead.temperatura}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Select 
                          value={lead.status} 
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as ListLeadsStatus)}
                          className={`h-9 py-1 px-3 text-xs w-auto min-w-[130px] font-medium border-0 ${
                            lead.status === 'Convertido' ? 'bg-emerald-500/10 text-emerald-400' :
                            lead.status === 'Contatado' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-slate-500/10 text-slate-300'
                          }`}
                        >
                          <option value="Novo" className="bg-background text-foreground">Novo</option>
                          <option value="Contatado" className="bg-background text-foreground">Contatado</option>
                          <option value="Convertido" className="bg-background text-foreground">Convertido</option>
                        </Select>
                      </td>
                      <td className="px-6 py-3 text-right">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="group-hover:border-primary/50 group-hover:bg-primary/10"
                           onClick={() => setSelectedLead(lead)}
                         >
                           Ver Detalhes <ArrowRight className="w-4 h-4 ml-1" />
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

      <MessageModal 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
      />
    </Layout>
  );
}
