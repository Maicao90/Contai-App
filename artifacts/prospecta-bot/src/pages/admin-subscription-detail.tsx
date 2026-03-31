import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, RotateCcw, ShieldCheck, Slash } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type SubscriptionDetail = {
  subscription: {
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
    membersCount: number;
    planName: string;
  };
  household: { id: number; name: string; type: string } | null;
  members: Array<{ id: number; name: string; role: string; status: string }>;
  statusHistory: Array<{ status: string; at: string | null; note: string }>;
  billingEvents: Array<{ type: string; at: string | null; source: string }>;
  notes: string;
};

export default function AdminSubscriptionDetailPage() {
  const [match, params] = useRoute("/admin/subscriptions/:id");
  const subscriptionId = match ? Number(params.id) : null;

  const { data, refetch } = useQuery({
    queryKey: ["admin-subscription-detail", subscriptionId],
    queryFn: () => getJson<SubscriptionDetail>(`/admin/subscriptions/${subscriptionId}`),
    enabled: Boolean(subscriptionId),
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => postJson(`/admin/subscriptions/${subscriptionId}/actions`, { action }),
    onSuccess: () => void refetch(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link href="/admin/subscriptions">
          <Button variant="outline" className="w-full rounded-2xl sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <PageHeader
          eyebrow="Admin • Assinatura"
          title={data?.subscription.householdName ?? "Detalhes da assinatura"}
          description="Acompanhe household, membros, histórico de status, cobranca e eventos administrativos."
          badge="Plano Contai"
        />

        <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Resumo da assinatura</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Plano</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.subscription.planName}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Status</p>
                  <div className="mt-2">
                    <UserStatusBadge status={data?.subscription.status ?? "trial"} />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Valor</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatCurrency(data?.subscription.amount ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Ciclo</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.subscription.cycle === "monthly" ? "mensal" : "anual"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Inicio</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.subscription.startedAt ? new Date(data.subscription.startedAt).toLocaleDateString("pt-BR") : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Renovacao</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.subscription.renewalDate ? new Date(data.subscription.renewalDate).toLocaleDateString("pt-BR") : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Household e membros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Conta</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.household?.name ?? data?.subscription.householdName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {data?.household?.type ?? "-"} • titular {data?.subscription.ownerName}
                  </p>
                </div>
                {data?.members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{member.name}</p>
                      <SimpleInfoBadge value={member.role} />
                      <UserStatusBadge status={member.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Histórico e cobranca</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 2xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Histórico de status</p>
                  {data?.statusHistory.map((item, index) => (
                    <div key={`${item.status}-${index}`} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserStatusBadge status={item.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-900">{item.note}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.at ? new Date(item.at).toLocaleString("pt-BR") : "-"}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Eventos de cobranca</p>
                  {data?.billingEvents.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.type}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.source}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.at ? new Date(item.at).toLocaleString("pt-BR") : "-"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Acoes administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("activate")}>
                  <ShieldCheck className="h-4 w-4" />
                  Ativar manualmente
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("suspend")}>
                  <Slash className="h-4 w-4" />
                  Suspender assinatura
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("reactivate")}>
                  <RotateCcw className="h-4 w-4" />
                  Reativar assinatura
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("update_renewal")}>
                  <RotateCcw className="h-4 w-4" />
                  Atualizar renovacao
                </Button>
                <Button className="w-full justify-start rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => actionMutation.mutate("mark_paid")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar pagamento confirmado
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Observacoes administrativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {data?.notes}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

