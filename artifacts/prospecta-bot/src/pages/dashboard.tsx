import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useLeadsData, 
  useLeadsStats, 
  useLeadsMutations 
} from "@/hooks/use-leads";
import { Lead, LeadStatus } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/status-badge";
import { MessageModal } from "@/components/message-modal";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  Target, 
  MapPin, 
  Globe, 
  Database, 
  Building2, 
  DollarSign, 
  Users, 
  Flame, 
  Loader2, 
  MessageSquareText,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Dashboard() {
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leads = [], isLoading: loadingLeads } = useLeadsData(
    statusFilter !== "all" ? { status: statusFilter as LeadStatus } : undefined
  );
  
  const { data: stats } = useLeadsStats();
  const { mineLeads, updateLead } = useLeadsMutations();

  const handleMine = () => {
    if (!nicho || !cidade) return;
    mineLeads.mutate({ data: { nicho, cidade } });
  };

  const handleStatusChange = (leadId: number, newStatus: LeadStatus) => {
    updateLead.mutate({ id: leadId, data: { status: newStatus } });
  };

  // KPI Configuration
  const kpis = [
    {
      title: "Total de Leads",
      value: stats?.totalLeads || 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "Leads Quentes",
      value: stats?.leadsQuentes || 0,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
    {
      title: "Contatados",
      value: stats?.contatados || 0,
      icon: MessageSquareText,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      title: "Receita Potencial",
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.receitaPotencial || 0),
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-400/10"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Search & Mining Section */}
        <section>
          <div className="relative overflow-hidden rounded-2xl glass p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Nicho de Mercado</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ex: Dentistas, Clínicas de Estética" 
                    className="pl-10 h-12 bg-background/50"
                    value={nicho}
                    onChange={(e) => setNicho(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Cidade / Região</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ex: São Paulo, Campinas" 
                    className="pl-10 h-12 bg-background/50"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleMine} 
                disabled={!nicho || !cidade || mineLeads.isPending}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                {mineLeads.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Minerando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Minerar Oportunidades
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-display font-bold text-foreground">
                    {kpi.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Main Table Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Pipeline de Leads
            </h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border/50">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Leads</SelectItem>
                {Object.values(LeadStatus).map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="glass border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Empresa</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loadingLeads ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          Nenhum lead encontrado. Inicie uma mineração acima.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-border/50 group hover:bg-secondary/10 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-border/50">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{lead.nomeEmpresa}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  {lead.nicho} • {lead.cidade}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {format(new Date(lead.dataCadastro), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex gap-2">
                              {!lead.temSite && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
                                      <Globe className="w-3.5 h-3.5" />
                                      Sem Site
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Empresa não possui website detectado</TooltipContent>
                                </Tooltip>
                              )}
                              {(!lead.temPixelMeta && !lead.temPixelGoogle) && lead.temSite && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      Sem Pixel
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Site existe, mas não possui rastreamento (Meta/Google)</TooltipContent>
                                </Tooltip>
                              )}
                              {lead.temSite && (lead.temPixelMeta || lead.temPixelGoogle) && (
                                <span className="text-xs text-muted-foreground italic px-2 py-1">
                                  Presença OK
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary border border-border/50 font-bold text-sm text-primary">
                              {lead.score}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Select 
                              value={lead.status} 
                              onValueChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                            >
                              <SelectTrigger className="w-[140px] h-9 border-0 bg-transparent p-0 hover:bg-secondary/50 focus:ring-0">
                                <StatusBadge status={lead.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(LeadStatus).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <StatusBadge status={status} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary-foreground hover:bg-primary"
                              onClick={() => setSelectedLead(lead)}
                            >
                              Ver Mensagem
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>
      </div>

      <MessageModal 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
      />
    </Layout>
  );
}
