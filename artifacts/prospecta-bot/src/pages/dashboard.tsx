import { Layout } from "@/components/layout";
import { Card, Badge } from "@/components/ui/shared";
import { useGetDashboardStats, useGetRecentLeads } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Users, Target, CheckCircle2, DollarSign, ArrowRight, Flame, ThermometerSun, Snowflake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentLeads, isLoading: leadsLoading } = useGetRecentLeads({ limit: 5 });

  const kpis = [
    { title: "Total de Leads", value: stats?.totalLeads || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Contatados", value: stats?.contatados || 0, icon: Target, color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Convertidos", value: stats?.convertidos || 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Receita Potencial", value: formatCurrency(stats?.receitaPotencial || 0), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
  ];

  const funnelData = stats ? [
    { name: 'Novos', value: stats.funil.novo, color: '#64748b' },
    { name: 'Contatados', value: stats.funil.contatado, color: '#3b82f6' },
    { name: 'Convertidos', value: stats.funil.convertido, color: '#10b981' },
  ] : [];

  const maxTemp = stats ? Math.max(stats.porTemperatura.quente, stats.porTemperatura.morno, stats.porTemperatura.frio, 1) : 1;

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus resultados de prospecção e conversão.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i} className="p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <kpi.icon className={`w-16 h-16 ${kpi.color}`} />
              </div>
              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
                <p className="text-3xl font-display font-bold text-white">
                  {statsLoading ? <span className="text-transparent bg-muted animate-pulse rounded">000</span> : kpi.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <Card className="p-6 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-6">Funil de Conversão</h2>
            <div className="flex-1 min-h-[250px] w-full">
              {statsLoading ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {funnelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Temperature */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-6">Temperatura dos Leads</h2>
            <div className="space-y-6">
              {[
                { label: "Quente", value: stats?.porTemperatura.quente || 0, icon: Flame, color: "bg-rose-500", text: "text-rose-400" },
                { label: "Morno", value: stats?.porTemperatura.morno || 0, icon: ThermometerSun, color: "bg-amber-500", text: "text-amber-400" },
                { label: "Frio", value: stats?.porTemperatura.frio || 0, icon: Snowflake, color: "bg-sky-500", text: "text-sky-400" },
              ].map((temp, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`font-medium flex items-center gap-2 ${temp.text}`}>
                      <temp.icon className="w-4 h-4" />
                      {temp.label}
                    </span>
                    <span className="text-muted-foreground font-medium">{temp.value} leads</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 border border-border/50 overflow-hidden">
                    <div 
                      className={`h-full ${temp.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${statsLoading ? 0 : (temp.value / maxTemp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Leads Recentes</h2>
            <Link href="/leads" className="text-sm text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Empresa</th>
                  <th className="px-6 py-4 font-medium">Temperatura</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {leadsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-muted rounded-full w-16" /></td>
                      <td className="px-6 py-4"><div className="h-5 bg-muted rounded-full w-20" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 bg-muted rounded w-16 inline-block" /></td>
                    </tr>
                  ))
                ) : recentLeads?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Nenhum lead encontrado ainda. Crie uma campanha!
                    </td>
                  </tr>
                ) : (
                  recentLeads?.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{lead.nomeEmpresa}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{lead.nicho}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={lead.temperatura === 'Quente' ? 'danger' : lead.temperatura === 'Morno' ? 'warning' : 'info'}>
                          {lead.temperatura}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={lead.status === 'Convertido' ? 'success' : lead.status === 'Contatado' ? 'info' : 'default'}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Link href={`/leads`} className="text-primary hover:underline text-sm font-medium">
                           Abrir →
                         </Link>
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
