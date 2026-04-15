import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, HelpCircle, Activity, Repeat, TrendingUp, DollarSign, PieChart, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Subscription = {
  id: number;
  householdId: number;
  householdName: string;
  ownerName: string;
  status: string;
  amount: number;
  cycle: string;
  startedAt: string;
  renewalDate: string | null;
  paymentMethod: string;
  coupon: string | null;
  membersCount: number;
  planName: string;
};

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState("all");

  const query = useMemo(() => {
    return status === "all" ? "/admin/subscriptions" : `/admin/subscriptions?status=${status}`;
  }, [status]);

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["admin-subscriptions", query],
    queryFn: () => getJson<Subscription[]>(query),
  });

  // Cálculo das Métricas SaaS (Sem comissões)
  const activeSubs = data?.filter((s) => s.status === "active") || [];
  const canceledSubs = data?.filter((s) => s.status === "canceled") || [];
  
  const activeCount = activeSubs.length;
  const renewalsCount = activeSubs.filter((s) => s.renewalDate).length;
  
  const mrr = activeSubs.reduce((sum, s) => {
    return sum + (s.cycle === "annual" ? s.amount / 12 : s.amount);
  }, 0);

  const churnRate = activeCount + canceledSubs.length > 0 
    ? ((canceledSubs.length / (activeCount + canceledSubs.length)) * 100) 
    : 0;
    
  // ARPU (Average Revenue Per User)
  const arpu = activeCount > 0 ? mrr / activeCount : 0;
  // LTV Estimado = ARPU / Churn Rate (assumindo Churn rate em decimal, mínimo 1% para não zerar divisão) 
  // Na ausência de Churn, estimamos 12 meses de retenção (ARPU * 12).
  const effectiveChurn = churnRate > 0 ? (churnRate / 100) : 0.08; // fallback 8% churn
  const ltv = arpu / effectiveChurn;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Assinaturas
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Última atualização: agora mesmo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value="sempre" onValueChange={() => {}}>
              <SelectTrigger className="h-10 w-32 rounded-xl bg-slate-900 border-white/10 text-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sempre">Sempre</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => refetch()} 
              disabled={isRefetching}
              variant="outline" 
              className="h-10 rounded-xl bg-slate-900 border-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Dashboard de Métricas */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card Ativas */}
          <Card className="bg-[#1C2329] border-white/5 shadow-none overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg"></div>
            <CardContent className="p-5 flex flex-col justify-between h-full hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  Ativas
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#313C47] text-slate-200 border-white/10">
                        <p>Número total de assinaturas ativas no momento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">{activeCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card Renovações */}
          <Card className="bg-[#1C2329] border-white/5 shadow-none overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg"></div>
            <CardContent className="p-5 flex flex-col justify-between h-full hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  Renovações
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#313C47] text-slate-200 border-white/10">
                        <p>Número de assinaturas ativas com data de renovação futura.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">{renewalsCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* LTV */}
          <Card className="bg-[#1C2329] border-white/5 shadow-none overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg"></div>
            <CardContent className="p-5 flex flex-col justify-between h-full hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  LTV
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#313C47] text-slate-200 border-white/10 max-w-xs z-50">
                        <p className="font-semibold mb-1">LTV (Lifetime Value)</p>
                        <p className="text-sm">é a receita total esperada de um cliente durante seu relacionamento com a empresa.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">{formatCurrency(ltv)}</span>
              </div>
            </CardContent>
          </Card>

          {/* MRR */}
          <Card className="bg-[#1C2329] border-white/5 shadow-none overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-lg"></div>
            <CardContent className="p-5 flex flex-col justify-between h-full hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  MRR
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#313C47] text-slate-200 border-white/10 max-w-xs z-50">
                        <p className="font-semibold mb-1">MRR (Monthly Recurring Revenue)</p>
                        <p className="text-sm">é a receita mensal recorrente de um negócio (assinaturas ativas somadas por mês).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">{formatCurrency(mrr)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Churn Rate */}
          <Card className="bg-[#1C2329] border-white/5 shadow-none overflow-hidden relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg"></div>
            <CardContent className="p-5 flex flex-col justify-between h-full hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                  Churn Rate
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#313C47] text-slate-200 border-white/10 z-50">
                        <p>Taxa de cancelamento de assinaturas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">{churnRate.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Assinaturas */}
        <Card className="bg-[#1C2329] border-white/5 shadow-xl">
          <CardContent className="p-0">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                  </svg>
                </div>
                <input 
                  type="text" 
                  className="bg-transparent border border-white/10 text-slate-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-64 pl-10 p-2 placeholder:text-slate-600" 
                  placeholder="Pesquisar..." 
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10 w-40 rounded-xl bg-transparent border-white/10 text-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-10 bg-transparent border-white/10 text-slate-300 gap-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.75 4H19M7.75 4a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 4h2.25m13.5 6H19m-2.25 0a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 10h11.25m-4.5 6H19M7.75 16a2.25 2.25 0 0 1-4.5 0m4.5 0a2.25 2.25 0 0 0-4.5 0M1 16h2.25"/>
                    </svg>
                    Filtros
                  </span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs uppercase bg-[#242C35] text-slate-400 border-b border-white/5">
                  <tr>
                    <th scope="col" className="px-6 py-4">Data</th>
                    <th scope="col" className="px-6 py-4">Plano</th>
                    <th scope="col" className="px-6 py-4">Produto</th>
                    <th scope="col" className="px-6 py-4">Membro (Titular)</th>
                    <th scope="col" className="px-6 py-4">Cupom</th>
                    <th scope="col" className="px-6 py-4">Renova Em</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    data.map((subscription) => (
                      <tr key={subscription.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(subscription.startedAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-300">{formatCurrency(subscription.amount)}/{subscription.cycle === "monthly" ? "mês" : "ano"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-medium">{subscription.planName}</span>
                            <span className="text-xs text-slate-500">{subscription.householdName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-emerald-400">
                          {subscription.ownerName}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                          {subscription.coupon ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">{subscription.coupon}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString("pt-BR") : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <UserStatusBadge status={subscription.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/subscriptions/${subscription.id}`}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Paginação Mock */}
            <div className="flex justify-center p-4 py-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-500 opacity-50 cursor-not-allowed">
                  &lt;
                </Button>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500 opacity-50 cursor-not-allowed">
                  &gt;
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
