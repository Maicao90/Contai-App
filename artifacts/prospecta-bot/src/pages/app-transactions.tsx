import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: number;
  type: string;
  amount: string;
  category: string;
  description: string;
  visibility: string;
  createdBy: string | null;
  transactionDate: string;
};

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AppTransactionsPage() {
  const { session } = useAuth();
  const householdId = session?.householdId ?? 1;
  const { data } = useQuery({
    queryKey: ["transactions", householdId],
    queryFn: () => getJson<Transaction[]>(`/transactions?householdId=${householdId}`),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Transações"
          title="Gastos e receitas da conta"
          description="Filtre por categoria, data e membro. A base já está pronta para edição e exclusão no próximo passo."
        />

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Lista de transações</CardTitle>
            <CardDescription>Movimentações vindas do WhatsApp e do painel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{item.description}</p>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{item.category}</Badge>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{item.visibility}</Badge>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">{formatTransactionDate(item.transactionDate)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.createdBy ?? "Sem autor"} ·{" "}
                      {formatTransactionDate(item.transactionDate)}
                    </p>
                  </div>
                  <p className={item.type === "income" ? "text-base font-semibold text-emerald-600" : "text-base font-semibold text-rose-500"}>
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(item.amount))}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
