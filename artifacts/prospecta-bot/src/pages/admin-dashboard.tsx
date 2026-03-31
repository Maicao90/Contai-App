import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  CreditCard,
  MessagesSquare,
  Users,
  Wallet,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type SeriesPoint = {
  day: string;
  total?: number;
  users?: number;
};

type AdminMetrics = {
  totalUsers: number;
  totalHouseholds: number;
  individualHouseholds: number;
  sharedHouseholds: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  messagesToday: number;
  totalTransactions: number;
  totalCommitments: number;
  estimatedAiCostToday: number;
  integrationFailures: number;
  pendingOpen: number;
  growthSeries: SeriesPoint[];
  messagesPerDay: SeriesPoint[];
  aiCostPerDay: SeriesPoint[];
  latestEvents: Array<{ id: number; label: string; createdAt: string }>;
  alerts: Array<{ type: string; message: string }>;
  planName: string;
  monthlyPlanPrice: number;
  annualPlanPrice: number;
};

function MiniBars({
  points,
  color,
  suffix = "",
}: {
  points: SeriesPoint[];
  color: string;
  suffix?: string;
}) {
  const values = points.map((point) => Number(point.total ?? point.users ?? 0));
  const max = Math.max(...values, 1);

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="flex min-w-[260px] items-end gap-2 sm:min-w-0">
      {points.map((point) => {
        const value = Number(point.total ?? point.users ?? 0);
        const height = `${Math.max((value / max) * 100, value ? 14 : 8)}%`;

        return (
          <div key={point.day} className="flex min-w-[52px] flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end rounded-2xl bg-slate-100/80 p-2">
              <div className={`w-full rounded-xl ${color}`} style={{ height }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-slate-700">{value}{suffix}</p>
              <p className="text-[11px] text-slate-500">{point.day.slice(5).replace("-", "/")}</p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: () => getJson<AdminMetrics>("/admin/metrics"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Visão operacional do Contai"
          description="Veja crescimento, uso, custos, alertas e eventos do SaaS em uma visão única de operação."
          badge={data?.planName ?? "Plano Contai"}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Usuários" value={String(data?.totalUsers ?? 0)} helper="Base total cadastrada" icon={Users} tone="slate" />
          <MetricCard title="Households" value={String(data?.totalHouseholds ?? 0)} helper="Contas individuais e compartilhadas" icon={Wallet} tone="slate" />
          <MetricCard title="Mensagens hoje" value={String(data?.messagesToday ?? 0)} helper="Entradas recebidas no dia" icon={MessagesSquare} tone="slate" />
          <MetricCard title="Custo IA hoje" value={formatCurrency(data?.estimatedAiCostToday ?? 0)} helper="Estimativa operacional atual" icon={Bot} tone="slate" />
          <MetricCard title="Assinaturas ativas" value={String(data?.activeSubscriptions ?? 0)} helper="Contas com acesso liberado" icon={CreditCard} tone="slate" />
          <MetricCard title="Assinaturas vencidas" value={String(data?.expiredSubscriptions ?? 0)} helper="Demandam acao administrativa" icon={AlertTriangle} tone="slate" />
          <MetricCard title="Transações" value={String(data?.totalTransactions ?? 0)} helper="Movimentações registradas" icon={Activity} tone="slate" />
          <MetricCard title="Compromissos" value={String(data?.totalCommitments ?? 0)} helper="Itens de agenda criados" icon={CalendarClock} tone="slate" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Visão do negócio</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">Contas individuais</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.individualHouseholds ?? 0}</p>
              </div>
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">Contas compartilhadas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.sharedHouseholds ?? 0}</p>
              </div>
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">Integrações com falha</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.integrationFailures ?? 0}</p>
              </div>
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">Pendências abertas</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data?.pendingOpen ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-slate-950 text-white shadow-[0_18px_45px_rgba(2,6,23,0.14)]">
            <CardHeader>
              <CardTitle className="text-white">Alertas do sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-slate-300">Carregando alertas...</p>
              ) : data?.alerts.length ? (
                data.alerts.map((alert, index) => (
                  <div key={`${alert.message}-${index}`} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <SimpleInfoBadge value={alert.type} />
                      <p className="text-sm text-slate-200">{alert.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  Nenhum alerta crítico aberto no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Crescimento de usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars points={data?.growthSeries ?? []} color="bg-emerald-500" />
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Mensagens por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars points={data?.messagesPerDay ?? []} color="bg-sky-500" />
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Custo de IA por período</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniBars points={data?.aiCostPerDay ?? []} color="bg-slate-900" suffix="" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Últimos eventos importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.latestEvents.length ? (
                data.latestEvents.map((event) => (
                  <div key={event.id} className="rounded-[20px] border border-slate-100 bg-white px-4 py-3.5">
                    <p className="font-medium text-slate-950">{event.label}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(event.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Sem eventos recentes para mostrar.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <CardHeader>
              <CardTitle>Saúde da operação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                <p className="text-sm text-slate-500">Plano ativo na plataforma</p>
                <p className="mt-1 font-semibold text-slate-950">Plano Contai</p>
                <p className="mt-1 text-sm text-slate-500">
                  Mensal R$ {String(data?.monthlyPlanPrice ?? 14.9).replace(".", ",")} ou anual R$ {String(data?.annualPlanPrice ?? 99.9).replace(".", ",")}, até 2 membros por conta.
                </p>
              </div>
              <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                <p className="text-sm text-slate-500">Pendências abertas</p>
                <p className="mt-1 font-semibold text-slate-950">{data?.pendingOpen ?? 0}</p>
              </div>
              <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                <p className="text-sm text-slate-500">Erros de integração</p>
                <p className="mt-1 font-semibold text-slate-950">{data?.integrationFailures ?? 0}</p>
              </div>
              {isError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Não foi possível carregar o dashboard agora.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}


