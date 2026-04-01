import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarRange,
  Mail,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { getJson, patchJson, postJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type MonthlyReportResponse = {
  period: {
    key: string;
    label: string;
    startsAt: string;
    endsAt: string;
  };
  metrics: {
    income: number;
    expenses: number;
    balance: number;
    topCategory: string | null;
    transactionsCount: number;
    billsCount: number;
    remindersCount: number;
    commitmentsCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percent: number;
  }>;
  topExpenses: Array<{
    id: number;
    description: string;
    category: string;
    amount: number;
    transactionDate: string;
  }>;
  dueBills: Array<{
    id: number;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
    type: string;
  }>;
  reminders: Array<{
    id: number;
    title: string;
    reminderDate: string;
    status: string;
  }>;
  commitments: Array<{
    id: number;
    title: string;
    commitmentDate: string;
    visibility: string;
  }>;
  emailPreferences: {
    enabled: boolean;
    email: string | null;
  };
};

function buildMonthOptions() {
  const now = new Date();
  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date);
    return { key, label };
  });
}

export default function AppReportsPage() {
  const { session } = useAuth();
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [month, setMonth] = useState(monthOptions[0]?.key ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ["app-reports", session?.userId, month],
    enabled: Boolean(session?.userId),
    queryFn: () =>
      getJson<MonthlyReportResponse>(`/reports/${session?.userId}/monthly?month=${month}`),
  });

  const preferencesMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      patchJson(`/reports/${session?.userId}/preferences`, {
        monthlyReportEmailEnabled: enabled,
      }),
    onSuccess: async () => {
      setFeedback("Preferência de e-mail atualizada.");
      await refetch();
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível atualizar a preferência.");
    },
  });

  const emailMutation = useMutation({
    mutationFn: () =>
      postJson(`/reports/${session?.userId}/send-monthly-email`, {
        month,
      }),
    onSuccess: async () => {
      setFeedback("Relatório mensal colocado na fila de e-mail.");
      await refetch();
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível preparar o relatório.");
    },
  });

  const highestCategoryValue = Math.max(
    ...(data?.categoryBreakdown.map((item) => item.total) ?? [1]),
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Relatórios"
          title="Veja para onde seu dinheiro está indo"
          description="Acompanhe seus gastos por categoria, os principais movimentos do mês e deixe o Contai preparar seu relatório mensal por e-mail."
          badge={data?.period?.label ?? "Resumo mensal"}
        />

        <Card className="border-white/70 bg-white/90 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-medium text-slate-900">Período do relatório</p>
              <p className="mt-1 text-sm text-slate-500">
                Escolha o mês para analisar gastos, vencimentos e compromissos.
              </p>
            </div>
            <div className="w-full sm:max-w-xs">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-11 rounded-2xl bg-white">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Gastos do mês"
            value={formatCurrency(data?.metrics.expenses ?? 0)}
            helper="Tudo o que saiu no período selecionado."
            icon={TrendingDown}
            tone="slate"
          />
          <MetricCard
            title="Entradas do mês"
            value={formatCurrency(data?.metrics.income ?? 0)}
            helper="Receitas e recebimentos registrados."
            icon={TrendingUp}
          />
          <MetricCard
            title="Saldo do período"
            value={formatCurrency(data?.metrics.balance ?? 0)}
            helper="Entradas menos saídas do mês."
            icon={Wallet}
          />
          <MetricCard
            title="Categoria principal"
            value={data?.metrics.topCategory ?? "Sem destaque"}
            helper="Categoria com mais gastos no período."
            icon={BarChart3}
            tone="slate"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Visão Geral Financeira</CardTitle>
              <CardDescription>
                Comparativo de entradas e saídas e distribuição por categorias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Pie Chart Section */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Gastos por categoria</p>
                <div className="h-[280px] w-full">
                  {data?.categoryBreakdown?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="total"
                          nameKey="category"
                        >
                          {data.categoryBreakdown.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={[
                                "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#064e3b"
                              ][index % 6]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                      Sem dados para exibir
                    </div>
                  )}
                </div>
              </div>

              {/* Bar Chart Section */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Entradas vs Saídas</p>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Fluxo", entradas: data?.metrics.income ?? 0, saídas: data?.metrics.expenses ?? 0 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis tickFormatter={(value) => `R$ ${value}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} barSize={60} />
                      <Bar dataKey="saídas" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={60} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Relatório mensal por e-mail</CardTitle>
              <CardDescription>
                O Contai prepara no fim do mês um resumo com seus gastos, vencimentos e compromissos para envio por e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Receber relatório no fim do mês</p>
                  <p className="text-sm leading-6 text-slate-500">
                    {data?.emailPreferences.email
                      ? `Envio configurado para ${data.emailPreferences.email}.`
                      : "Cadastre um e-mail nas configurações para liberar esse envio."}
                  </p>
                </div>
                <Switch
                  checked={Boolean(data?.emailPreferences.enabled)}
                  onCheckedChange={(checked) => {
                    setFeedback(null);
                    preferencesMutation.mutate(checked);
                  }}
                  disabled={preferencesMutation.isPending}
                />
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">O que entra nesse e-mail</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">Gastos por categoria</Badge>
                  <Badge variant="outline">Contas com vencimento</Badge>
                  <Badge variant="outline">Lembretes</Badge>
                  <Badge variant="outline">Compromissos</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  O módulo já deixa o relatório pronto e coloca o disparo na fila mensal do sistema.
                </p>
              </div>

              <Button
                className="w-full rounded-2xl"
                onClick={() => {
                  setFeedback(null);
                  emailMutation.mutate();
                }}
                disabled={emailMutation.isPending}
              >
                <Mail className="h-4 w-4" />
                {emailMutation.isPending ? "Preparando relatório..." : "Preparar relatório deste mês para meu e-mail"}
              </Button>

              {feedback ? (
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  {feedback}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Maiores gastos do período</CardTitle>
              <CardDescription>
                Itens que mais pesaram no mês para você entender melhor seus principais movimentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.topExpenses?.length ? (
                data.topExpenses.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{item.description}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.category} • {new Date(item.transactionDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-rose-500">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  Nenhum gasto relevante no período selecionado.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-emerald-600" />
                  Contas e vencimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.dueBills?.length ? (
                  data.dueBills.map((bill) => (
                    <div key={bill.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{bill.title}</p>
                        <Badge variant="outline">{bill.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(bill.dueDate).toLocaleDateString("pt-BR")} • {formatCurrency(bill.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma conta com vencimento nesse período.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-emerald-600" />
                  Agenda do período
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.commitments?.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.commitmentDate).toLocaleString("pt-BR")} • {item.visibility}
                    </p>
                  </div>
                ))}
                {data?.reminders?.slice(0, 2).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.reminderDate).toLocaleString("pt-BR")} • {item.status}
                    </p>
                  </div>
                ))}
                {!data?.commitments?.length && !data?.reminders?.length ? (
                  <p className="text-sm text-slate-500">Sem compromissos ou lembretes registrados nesse mês.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </section>

        {isLoading || isFetching ? (
          <Card className="border-white/70 bg-white/90 shadow-sm">
            <CardContent className="p-4 text-sm text-slate-500 sm:p-5">
              Atualizando relatório...
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
