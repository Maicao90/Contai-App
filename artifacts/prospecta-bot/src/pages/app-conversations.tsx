import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";

type ConversationLog = {
  id: number;
  content: string;
  intent: string;
  direction: string;
  sourceType: string;
  structuredData: unknown;
  createdAt: string;
};

export default function AppConversationsPage() {
  const { session } = useAuth();
  const householdId = session?.householdId ?? 1;
  const { data } = useQuery({
    queryKey: ["conversation-logs", householdId],
    queryFn: () => getJson<ConversationLog[]>(`/conversations?householdId=${householdId}`),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Conversas"
          title="Histórico estruturado do WhatsApp"
          description="Veja a mensagem, a intenção detectada e os dados extraídos de cada interação."
        />

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Logs recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{item.direction}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{item.intent}</Badge>
                  <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">{item.sourceType}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-900">{item.content}</p>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-5 text-emerald-100 sm:p-4 sm:text-xs">
                  {JSON.stringify(item.structuredData, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
