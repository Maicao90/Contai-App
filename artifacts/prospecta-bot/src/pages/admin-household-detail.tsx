import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Power, RotateCcw, UserMinus } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type HouseholdDetail = {
  household: {
    id: number;
    name: string;
    type: string;
    ownerName: string;
    membersCount: number;
    subscriptionStatus: string;
    renewalDate: string | null;
    planName: string;
  };
  members: Array<{ id: number; name: string; role: string; status: string; messagesCount: number }>;
  subscription: { status: string; renewalDate: string | null; planName: string } | null;
  financial: {
    latestTransactions: Array<{ id: number; description: string; category: string; amount: number }>;
    spendingByMember: Array<{ name: string; total: number }>;
  };
  agenda: {
    commitments: Array<{ id: number; title: string; commitmentDate: string; visibility: string }>;
  };
  bills: Array<{ id: number; title: string; status: string; dueDate: string; amount: string | number }>;
  logs: Array<{ id: number; originalContent: string; intent: string; createdAt: string; engine: string }>;
};

export default function AdminHouseholdDetailPage() {
  const [match, params] = useRoute("/admin/households/:id");
  const householdId = match ? Number(params.id) : null;

  const { data, refetch } = useQuery({
    queryKey: ["admin-household-detail", householdId],
    queryFn: () => getJson<HouseholdDetail>(`/admin/households/${householdId}`),
    enabled: Boolean(householdId),
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => postJson(`/admin/households/${householdId}/actions`, { action }),
    onSuccess: () => void refetch(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link href="/admin/households">
          <Button variant="outline" className="w-full rounded-2xl sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <PageHeader
          eyebrow="Admin · Household"
          title={data?.household.name ?? "Detalhes da conta"}
          description="Veja membros, assinatura, gastos, compromissos, contas a vencer e logs recentes da conta."
          badge="Plano Contai"
        />

        <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Dados da conta</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Tipo</p>
                  <div className="mt-2 flex gap-2">
                    <SimpleInfoBadge value={data?.household.type ?? "-"} />
                    <UserStatusBadge status={data?.household.subscriptionStatus ?? "trial"} />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Titular</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.household.ownerName}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Membros</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.household.membersCount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Renovacao</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.household.renewalDate ? new Date(data.household.renewalDate).toLocaleDateString("pt-BR") : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Membros vinculados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{member.name}</p>
                      <SimpleInfoBadge value={member.role} />
                      <UserStatusBadge status={member.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{member.messagesCount} mensagens registradas</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Financeiro da conta</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 2xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Ultimas movimentacoes</p>
                  {data?.financial.latestTransactions.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.category} · {formatCurrency(Number(item.amount))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Gastos por membro</p>
                  {data?.financial.spendingByMember.map((item) => (
                    <div key={item.name} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Acoes da conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("remove_partner")}>
                  <UserMinus className="h-4 w-4" />
                  Remover parceiro
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => actionMutation.mutate("deactivate")}>
                  <Power className="h-4 w-4" />
                  Desativar conta
                </Button>
                <Button className="w-full justify-start rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => actionMutation.mutate("reactivate")}>
                  <RotateCcw className="h-4 w-4" />
                  Reativar conta
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Compromissos da conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.agenda.commitments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.commitmentDate).toLocaleString("pt-BR")} · {item.visibility}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Contas a vencer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.bills.map((bill) => (
                  <div key={bill.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{bill.title}</p>
                      <SimpleInfoBadge value={bill.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(bill.dueDate).toLocaleDateString("pt-BR")} · {formatCurrency(Number(bill.amount))}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Logs recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SimpleInfoBadge value={log.intent} />
                      <SimpleInfoBadge value={log.engine} />
                    </div>
                    <p className="mt-2 text-sm text-slate-900">{log.originalContent}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
