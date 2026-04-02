import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";

type SupportData = {
  problematicUsers: Array<{ id: number; name: string; billingStatus: string }>;
  pendingProcessings: Array<{ id: number; kind: string; question: string }>;
};

export default function AdminSupportPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-support"],
    queryFn: () => getJson<SupportData>("/admin/support"),
  });
  const mutation = useMutation({
    mutationFn: (conversationId: number) =>
      postJson("/admin/support/reprocess", { conversationId }),
    onSuccess: () => void refetch(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader eyebrow="Admin · Suporte" title="Operação assistida e correções" description="Veja contas problemáticas, itens pendentes e reprocessamento manual." />
        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Usuários problemáticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.problematicUsers.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 px-5 py-4">
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.billingStatus}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Pendências reprocessáveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.pendingProcessings.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 px-5 py-4">
                  <p className="font-semibold text-slate-950">{item.kind}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.question}</p>
                  <Button className="mt-3 rounded-2xl" onClick={() => mutation.mutate(item.id)}>
                    Reprocessar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
