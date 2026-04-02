import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CalendarClock, CreditCard, Wallet } from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type OverviewResponse = {
  user: { id: number; name: string; phone: string; billingStatus: string };
  balance: number;
  income: number;
  expenses: number;
  transactions: Array<{ id: number; category: string; description: string; amount: string; type: string }>;
  commitments: Array<{ id: number; title: string; commitmentDate: string }>;
  reminders: Array<{ id: number; title: string; reminderDate: string }>;
  categoryBreakdown: Array<{ category: string; total: number }>;
  subscription: { planName: string; status: string; renewalDate: string } | null;
};

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="border-white/70 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["overview"],
    queryFn: () => getJson<OverviewResponse>("/overview?userId=1"),
  });

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-emerald-100 bg-white/85 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Contai
              </Badge>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Organize seu dinheiro e sua rotina sem esforço
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Tudo em um lugar só: saldo, gastos por categoria, agenda do dia e o
                fluxo do WhatsApp que transforma mensagem em organização.
              </p>
            </div>
            <Card className="min-w-[280px] border-emerald-100 bg-emerald-600 text-white">
              <CardHeader>
                <CardDescription className="text-emerald-50">
                  Plano ativo
                </CardDescription>
                <CardTitle className="text-white">
                  {data?.subscription?.planName ?? "Teste grátis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-emerald-50">
                <p>Status: {data?.subscription?.status ?? data?.user.billingStatus ?? "trial"}</p>
                <p>
                  Renovação:{" "}
                  {data?.subscription
                    ? new Date(data.subscription.renewalDate).toLocaleDateString("pt-BR")
                    : "em 7 dias"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Saldo do mês"
            value={formatCurrency(data?.balance ?? 0)}
            helper="Entradas menos saídas do período"
            icon={Wallet}
          />
          <StatCard
            title="Entradas"
            value={formatCurrency(data?.income ?? 0)}
            helper="Receitas registradas via WhatsApp e painel"
            icon={ArrowUpRight}
          />
          <StatCard
            title="Saídas"
            value={formatCurrency(data?.expenses ?? 0)}
            helper="Despesas capturadas e categorizadas"
            icon={ArrowDownRight}
          />
          <StatCard
            title="Agenda de hoje"
            value={String(data?.commitments.length ?? 0)}
            helper="Compromissos e lembretes ativos"
            icon={CalendarClock}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Últimas movimentações</CardTitle>
              <CardDescription>O que entrou e saiu recentemente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.transactions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.description}</p>
                    <p className="text-sm text-slate-500">{item.category}</p>
                  </div>
                  <p
                    className={
                      item.type === "income"
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-rose-500"
                    }
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(item.amount))}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Gastos por categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {data?.categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.category}</span>
                      <span className="text-slate-500">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.total / Math.max(...(data?.categoryBreakdown.map((entry) => entry.total) ?? [1]))) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-slate-950 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-emerald-300" />
                  Rotina do dia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200">
                {data?.commitments.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/5 px-4 py-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-slate-400">
                      {new Date(item.commitmentDate).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
                {data?.reminders.slice(0, 2).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-slate-400">
                      {new Date(item.reminderDate).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
