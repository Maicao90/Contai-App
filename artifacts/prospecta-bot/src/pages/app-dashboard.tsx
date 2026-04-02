import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Wallet } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BOT_WHATSAPP_LINK } from "@/lib/constants";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type OverviewResponse = {
  user: { id: number; name: string; phone: string; billingStatus: string };
  household: { id: number; name: string; type: string };
  balance: number;
  income: number;
  expenses: number;
  transactions: Array<{ id: number; category: string; description: string; amount: string; type: string; transactionDate: string }>;
  commitments: Array<{ id: number; title: string; commitmentDate: string }>;
  reminders: Array<{ id: number; title: string; reminderDate: string }>;
  bills: Array<{ id: number; title: string; dueDate: string; status: string; amount: string | null }>;
  categoryBreakdown: Array<{ category: string; total: number }>;
  subscription: { planName: string; status: string; endsAt: string } | null;
};

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AppDashboardPage() {
  const { session } = useAuth();
  const { data } = useQuery({
    queryKey: ["app-overview", session?.userId],
    queryFn: () => getJson<OverviewResponse>(`/overview?userId=${session?.userId ?? 1}`),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Painel do usuário"
          title="Sua vida financeira e sua rotina em um só lugar"
          description="Veja saldo do mês, agenda do dia, contas próximas e o histórico capturado pelo WhatsApp."
          badge={data?.household?.type === "couple" ? "Plano casal/família" : "Plano individual"}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Saldo do mês"
            value={formatCurrency(data?.balance ?? 0)}
            helper="Entradas menos saídas do período"
            icon={Wallet}
          />
          <MetricCard
            title="Entradas"
            value={formatCurrency(data?.income ?? 0)}
            helper="Receitas registradas pelo WhatsApp"
            icon={ArrowUpRight}
          />
          <MetricCard
            title="Saídas"
            value={formatCurrency(data?.expenses ?? 0)}
            helper="Despesas categorizadas automaticamente"
            icon={ArrowDownRight}
          />
          <MetricCard
            title="Agenda do dia"
            value={String((data?.commitments?.length ?? 0) + (data?.reminders?.length ?? 0))}
            helper="Compromissos e lembretes ativos"
            icon={CalendarClock}
          />
        </section>

        <section>
          <Card className="border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="space-y-1 text-center md:text-left">
                <CardTitle className="text-emerald-900 dark:text-emerald-100">
                  Pronto para começar?
                </CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-300">
                  Mande um "Oi" para o seu assistente no WhatsApp para começar a anotar seus gastos e compromissos.
                </CardDescription>
              </div>
              <Button
                asChild
                className="bg-emerald-600 px-8 hover:bg-emerald-700"
              >
                <a
                  href={BOT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Conversar com o Robô
                </a>
              </Button>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Últimas movimentações</CardTitle>
              <CardDescription>Gastos e receitas mais recentes da conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.transactions?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-slate-100 bg-white px-4 py-3.5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {item.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{item.description}</p>
                        <p className="text-sm text-slate-500">{item.category} · {formatTransactionDate(item.transactionDate)}</p>
                      </div>
                    </div>
                    <p className={item.type === "income" ? "text-base font-semibold text-emerald-600 sm:text-right" : "text-base font-semibold text-rose-500 sm:text-right"}>
                      {item.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(item.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

            <div className="grid min-w-0 gap-4">
            <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <CardHeader>
                <CardTitle>Gastos por categoria</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.categoryBreakdown ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="category"
                      >
                        {(data?.categoryBreakdown ?? []).map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              "#059669", // Contai Primary
                              "#f43f5e", // Rose
                              "#eab308", // Yellow
                              "#3b82f6", // Blue
                              "#8b5cf6", // Purple
                              "#f97316"  // Orange
                            ][index % 6]} 
                            className="stroke-white dark:stroke-slate-900" 
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }}
                        itemStyle={{ color: '#0F172A' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {data?.categoryBreakdown?.slice(0, 4).map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ backgroundColor: [
                            "#059669", "#f43f5e", "#eab308", "#3b82f6", "#8b5cf6", "#f97316"
                          ][index % 6] }} 
                        />
                        <span className="font-medium text-slate-700">{item.category}</span>
                      </div>
                      <span className="text-slate-500">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-slate-950 text-white shadow-[0_18px_45px_rgba(2,6,23,0.14)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-emerald-300" />
                  Contas próximas do vencimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200">
                {data?.bills?.slice(0, 3).map((bill) => (
                  <div key={bill.id} className="rounded-[20px] border border-white/8 bg-white/5 px-4 py-3.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{bill.title}</p>
                      <Badge className="bg-white/10 text-white hover:bg-white/10">{bill.status}</Badge>
                    </div>
                    <p className="mt-1 text-slate-400">
                      {new Date(bill.dueDate).toLocaleDateString("pt-BR")} ·{" "}
                      {bill.amount ? formatCurrency(Number(bill.amount)) : "valor pendente"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
