import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BOT_WHATSAPP_LINK } from "@/lib/constants";

type Subscription = {
  planName: string;
  cycle: string;
  paymentMethod: string;
  amount: string;
  status: string;
  endsAt: string;
};

type CheckoutPreview = {
  checkoutUrl: string;
  cycle: string;
  amount: number;
  installments: string | null;
  status: string;
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

export default function SubscriptionPage() {
  const { session } = useAuth();

  const initialCycle = useMemo(() => {
    if (typeof window === "undefined") {
      return "annual" as const;
    }
    return new URLSearchParams(window.location.search).get("cycle") === "monthly"
      ? ("monthly" as const)
      : ("annual" as const);
  }, []);

  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">(initialCycle);
  const householdId = session?.householdId ?? null;

  const { data } = useQuery({
    queryKey: ["subscription", householdId],
    queryFn: () => getJson<Subscription | null>(`/subscriptions/${householdId}`),
    enabled: Boolean(householdId),
  });

  const checkoutMutation = useMutation({
    mutationFn: (cycle: "monthly" | "annual") =>
      postJson<CheckoutPreview>("/billing/checkout-simulate", {
        cycle,
        paymentMethod: "pix",
      }),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  const hasDefinedSubscription = Number(data?.amount ?? 0) > 0 && data?.status !== "pending";

  return (
    <Layout>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-emerald-100 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Escolha sua cobrança</CardTitle>
            <CardDescription className="dark:text-slate-300">
              Seu acesso já está criado. Agora falta só definir como você quer começar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-white">Plano:</strong> {data?.planName ?? "Plano Contai"}
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Status:</strong>{" "}
              {hasDefinedSubscription ? translateSubscriptionStatus(data?.status) : "Aguardando escolha"}
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Cobrança:</strong>{" "}
              {hasDefinedSubscription ? (data?.cycle === "monthly" ? "Mensal" : "Anual") : "a definir"}
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Renovação:</strong>{" "}
              {hasDefinedSubscription && data?.endsAt ? new Date(data.endsAt).toLocaleDateString("pt-BR") : "definida após a escolha"}
            </p>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              Sua conta já foi criada com sucesso. Agora você escolhe entre <strong>mensal</strong> ou <strong>anual</strong> antes de seguir para o checkout.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-950 text-white dark:border-white/10 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="text-white">Escolha sua cobrança</CardTitle>
            <CardDescription className="text-slate-300">
              O mensal entra com mais flexibilidade. O anual entrega o melhor custo-benefício.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedCycle("monthly")}
                className={`rounded-3xl border p-4 text-left transition ${
                  selectedCycle === "monthly"
                    ? "border-white/20 bg-white/10 ring-1 ring-white/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-sm text-slate-300">Plano mensal</p>
                <p className="mt-2 text-3xl font-semibold text-white">R$14,90</p>
                <p className="mt-2 text-sm text-slate-300">Mais flexibilidade para começar.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCycle("annual")}
                className={`rounded-3xl border p-4 text-left transition ${
                  selectedCycle === "annual"
                    ? "border-emerald-300/20 bg-emerald-500/10 ring-1 ring-emerald-300/20"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-emerald-300">Plano anual</p>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                    Melhor escolha
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold text-white">R$99,90</p>
                <p className="mt-2 text-sm text-slate-300">Economize R$78,90 no ano com o mesmo produto.</p>
              </button>
            </div>

            <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-4 md:block">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-4 w-4 text-emerald-300" />
                Plano Contai para até 2 membros
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {[
                  "Uso no WhatsApp",
                  "Painel web",
                  "Agenda e lembretes",
                  "Google Agenda integrado",
                  "Categorias personalizadas",
                  "Conta individual ou compartilhada",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => checkoutMutation.mutate(selectedCycle)}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending
                ? "Preparando checkout..."
                : selectedCycle === "annual"
                  ? "Seguir com anual"
                  : "Seguir com mensal"}
            </Button>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                variant="outline"
                className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <a
                  href={BOT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar agora com o Robô
                </a>
              </Button>
            </div>

            {checkoutMutation.data ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-slate-100">
                  <p>
                    Checkout preparado para o ciclo <strong>{checkoutMutation.data.cycle === "monthly" ? "mensal" : "anual"}</strong>.
                  </p>
                  <p className="mt-1">
                    Valor: <strong>R${checkoutMutation.data.amount.toFixed(2).replace(".", ",")}</strong>
                  </p>
                  {checkoutMutation.data.installments ? <p className="mt-1">{checkoutMutation.data.installments}</p> : null}
                </div>
                <Button 
                  asChild
                  className="w-full h-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-bold"
                >
                  <a href="/app/dashboard">Entrar no Painel Agora</a>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
