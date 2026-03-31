import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, ReceiptText } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Bill = {
  id: number;
  title: string;
  amount: string | null;
  dueDate: string;
  status: string;
  type: string;
  visibility: string;
  googleCalendarEventId: string | null;
};

export default function AppBillsPage() {
  const { session } = useAuth();
  const householdId = session?.householdId ?? 1;
  const { data } = useQuery({
    queryKey: ["bills", householdId],
    queryFn: () => getJson<Bill[]>(`/bills?householdId=${householdId}`),
  });

  const pending = data?.filter((item) => item.status === "pending").length ?? 0;
  const paid = data?.filter((item) => item.status === "paid").length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Contas"
          title="Contas a pagar e a receber"
          description="Acompanhe vencimentos no Contai e veja quais contas já foram levadas para o Google Agenda."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Contas pendentes" value={String(pending)} helper="Aguardando pagamento ou recebimento" icon={Clock3} />
          <MetricCard title="Contas concluídas" value={String(paid)} helper="Já marcadas como pagas ou recebidas" icon={CheckCircle2} />
          <MetricCard title="Recorrentes" value={String(data?.filter((item) => item.type === "payable").length ?? 0)} helper="Base pronta para automação mensal" icon={ReceiptText} />
        </section>

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Status das contas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.map((bill) => (
              <div key={bill.id} className="rounded-3xl border border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{bill.title}</p>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{bill.type}</Badge>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{bill.visibility}</Badge>
                      {bill.googleCalendarEventId ? (
                        <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                          No Google Agenda
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Vence em {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-slate-950">
                      {bill.amount ? formatCurrency(Number(bill.amount)) : "A definir"}
                    </p>
                    <p className="text-sm text-slate-500">{bill.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
