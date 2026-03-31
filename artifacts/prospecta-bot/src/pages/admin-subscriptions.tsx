import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  membersCount: number;
  planName: string;
};

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState("all");

  const query = useMemo(() => {
    return status === "all" ? "/admin/subscriptions" : `/admin/subscriptions?status=${status}`;
  }, [status]);

  const { data } = useQuery({
    queryKey: ["admin-subscriptions", query],
    queryFn: () => getJson<Subscription[]>(query),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Assinaturas"
          title="Assinaturas e cobrança"
          description="Monitore status, renovação e membros da conta, com as ações administrativas concentradas na tela de detalhe."
          badge="Plano Contai"
        />

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:max-w-xs">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 rounded-2xl bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assinaturas do SaaS</CardTitle>
            <p className="text-sm text-slate-500">{data?.length ?? 0} assinatura(s)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.map((subscription) => (
              <div key={subscription.id} className="rounded-[28px] border border-slate-100 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-start">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{subscription.householdName}</p>
                      <SimpleInfoBadge value={subscription.planName} tone="emerald" />
                      <UserStatusBadge status={subscription.status} />
                    </div>
                    <p className="text-sm text-slate-500">
                      Titular: {subscription.ownerName} • {subscription.membersCount} membro(s)
                    </p>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Cobrança</p>
                        <p className="mt-1 font-medium text-slate-900">{formatCurrency(subscription.amount)}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {subscription.cycle === "monthly" ? "mensal" : "anual"} • {subscription.paymentMethod}
                        </p>
                      </div>
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Datas</p>
                        <p className="mt-1 text-sm text-slate-900">
                          Início: {new Date(subscription.startedAt).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Renovação: {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString("pt-BR") : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Regra do produto</p>
                    <p className="mt-1 font-semibold text-slate-900">Mensal ou anual</p>
                    <p className="mt-1 text-sm text-slate-500">Plano Contai com os mesmos recursos, em cobrança mensal ou anual, até 2 membros por conta.</p>
                  </div>

                  <div className="grid gap-2 xl:min-w-[210px]">
                    <Link href={`/admin/subscriptions/${subscription.id}`}>
                      <Button variant="outline" className="justify-start rounded-2xl">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
