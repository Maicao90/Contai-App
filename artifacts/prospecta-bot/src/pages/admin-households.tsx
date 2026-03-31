import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson } from "@/lib/api";

type Household = {
  id: number;
  name: string;
  type: string;
  membersCount: number;
  ownerName: string;
  subscriptionStatus: string;
  renewalDate: string | null;
  lastActivityAt: string;
  totalTransactions: number;
  totalCommitments: number;
  planName: string;
};

export default function AdminHouseholdsPage() {
  const { data, isFetching, isError } = useQuery({
    queryKey: ["admin-households"],
    queryFn: () => getJson<Household[]>("/admin/households"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Contas"
          title="Households operacionais"
          description="Veja titular, membros, atividade e assinatura por conta, com as ações concentradas na tela de detalhes."
          badge="Plano Contai"
        />

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contas cadastradas</CardTitle>
            <p className="text-sm text-slate-500">
              {data?.length ?? 0} conta(s) {isFetching ? "• atualizando..." : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.map((household) => (
              <div key={household.id} className="rounded-[28px] border border-slate-100 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-start">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{household.name}</p>
                      <SimpleInfoBadge value={household.type} />
                      <SimpleInfoBadge value={household.planName} tone="emerald" />
                      <UserStatusBadge status={household.subscriptionStatus} />
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Estrutura</p>
                        <p className="mt-1 font-medium text-slate-900">{household.membersCount} membro(s)</p>
                        <p className="mt-1 text-sm text-slate-500">Titular: {household.ownerName}</p>
                      </div>
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Uso da conta</p>
                        <p className="mt-1 font-medium text-slate-900">{household.totalTransactions} transações</p>
                        <p className="mt-1 text-sm text-slate-500">{household.totalCommitments} compromissos</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Renovação</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {household.renewalDate ? new Date(household.renewalDate).toLocaleDateString("pt-BR") : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Última atividade</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {new Date(household.lastActivityAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 xl:min-w-[200px]">
                    <Link href={`/admin/households/${household.id}`}>
                      <Button variant="outline" className="justify-start rounded-2xl">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {!data?.length && !isError ? (
              <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                Nenhuma conta encontrada.
              </div>
            ) : null}

            {isError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                Não foi possível carregar as contas agora.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
