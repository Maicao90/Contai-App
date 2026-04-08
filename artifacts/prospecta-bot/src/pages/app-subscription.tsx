import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, Repeat, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Subscription = {
  planName: string;
  cycle: string;
  paymentMethod: string;
  amount: string;
  status: string;
  startedAt: string;
  endsAt: string;
};

function translateSubscriptionStatus(status?: string) {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "Ativo";
    case "pending":
      return "Pendente";
    case "suspended":
      return "Suspenso";
    case "canceled":
      return "Cancelado";
    default:
      return "Ativo";
  }
}

export default function AppSubscriptionPage() {
  const { session } = useAuth();
  const householdId = session?.householdId ?? 1;

  const { data } = useQuery({
    queryKey: ["subscription", householdId],
    queryFn: () => getJson<Subscription | null>(`/subscriptions/${householdId}`),
  });

  const cycle = data?.cycle === "monthly" ? "monthly" : "annual";
  const startedAt = data?.startedAt ? new Date(data.startedAt) : null;
  const endsAt = data?.endsAt ? new Date(data.endsAt) : null;
  const now = new Date();
  const usingSinceLabel = startedAt
    ? startedAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "cadastro recente";
  const daysUsing = startedAt
    ? Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const currentAmount =
    data?.amount && Number(data.amount) > 0
      ? formatCurrency(Number(data.amount))
      : cycle === "monthly"
        ? "R$14,90"
        : "R$99,90";
  const nextCycleHref = cycle === "annual" ? "/assinatura?cycle=monthly" : "/assinatura?cycle=annual";
  const nextCycleLabel = cycle === "annual" ? "Trocar para mensal" : "Trocar para anual";

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Assinatura"
          title="Seu plano e sua cobrança em um só lugar"
          description="Veja ciclo atual, renovação, tempo de uso e escolha quando quiser entre mensal e anual."
          badge={cycle === "annual" ? "Anual ativo" : "Mensal ativo"}
        />

        <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Resumo da assinatura</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Plano</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {data?.planName ?? "Plano Contai"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {translateSubscriptionStatus(data?.status)}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Cobrança</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {cycle === "monthly" ? "Mensal" : "Anual"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Valor</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{currentAmount}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Renovação</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {endsAt ? endsAt.toLocaleDateString("pt-BR") : "em breve"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Usando desde</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-950 dark:text-white">
                {usingSinceLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {daysUsing > 0 ? `${daysUsing} dia(s) de uso` : "Conta recém-criada"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Trocar forma de cobrança</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div
              className={`rounded-3xl border px-5 py-4 ${
                cycle === "monthly"
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-400/25 dark:bg-emerald-500/10"
                  : "border-slate-100 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Mensal</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">R$14,90/mês</p>
                </div>
                {cycle === "monthly" ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Plano atual</Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Entre com mais flexibilidade, sem perder nada do produto.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <Repeat className="h-4 w-4" />
                Renovação recorrente mês a mês.
              </div>
              <Button asChild variant="outline" className="mt-4 rounded-2xl">
                <a href="/assinatura?cycle=monthly">
                  {cycle === "monthly" ? "Gerenciar mensal" : "Escolher mensal"}
                </a>
              </Button>
            </div>

            <div
              className={`rounded-3xl border px-5 py-4 ${
                cycle === "annual"
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-400/25 dark:bg-emerald-500/10"
                  : "border-slate-100 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">Melhor escolha</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">R$99,90/ano</p>
                </div>
                {cycle === "annual" ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Plano atual</Badge>
                ) : (
                  <Badge className="bg-slate-950 text-white hover:bg-slate-950 dark:bg-white/10 dark:text-white dark:hover:bg-white/10">
                    Mais economia
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Mesmo produto, mesmos recursos e melhor custo-benefício no ano.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <Sparkles className="h-4 w-4" />
                Menor custo mensal equivalente no Contai.
              </div>
              <Button asChild className="mt-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                <a href="/assinatura?cycle=annual">
                  {cycle === "annual" ? "Gerenciar anual" : "Escolher anual"}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Seu momento atual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <p className="font-semibold">Ciclo atual: {cycle === "annual" ? "Anual" : "Mensal"}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {cycle === "annual"
                  ? "Sua conta está no anual, com a melhor economia para continuar usando WhatsApp, painel e agenda no mesmo produto."
                  : "Sua conta está no mensal, ideal para manter flexibilidade e mudar de ciclo quando quiser."}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <CalendarDays className="h-4 w-4" />
                {endsAt ? `Próxima renovação em ${endsAt.toLocaleDateString("pt-BR")}.` : "Renovação será definida no checkout."}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Troca rápida</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{nextCycleLabel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {cycle === "annual"
                  ? "Se quiser mais flexibilidade, você pode seguir para o mensal no próximo checkout."
                  : "Se quiser economizar mais no produto, você pode migrar para o anual."}
              </p>
              <Button asChild className="mt-4 rounded-2xl bg-slate-950 hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
                <a href={nextCycleHref}>{nextCycleLabel}</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Permissão desta conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-300">Seu acesso</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {session?.role === "owner" ? "Titular com controle da assinatura" : "Membro com acesso de leitura"}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {session?.role === "owner"
                  ? "Você pode gerenciar assinatura, membros da conta e acompanhar a cobrança atual."
                  : "Você pode usar o sistema normalmente, mas não pode alterar ou cancelar a assinatura."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
