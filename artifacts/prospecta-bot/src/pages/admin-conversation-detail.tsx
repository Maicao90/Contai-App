import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson } from "@/lib/api";

type ConversationDetail = {
  id: number;
  userName: string;
  householdName: string;
  memberName: string | null;
  rawMessage: string;
  transcribedContent: string | null;
  imageAnalysis: string | null;
  structuredData: string | null;
  decision: string;
  responseSent: string | null;
  sourceType: string;
  engine: string;
  error: string | null;
  trace: Array<{ step: string; detail: string }>;
};

export default function AdminConversationDetailPage() {
  const [match, params] = useRoute("/admin/conversations/:id");
  const conversationId = match ? Number(params.id) : null;

  const { data } = useQuery({
    queryKey: ["admin-conversation-detail", conversationId],
    queryFn: () => getJson<ConversationDetail>(`/admin/conversations/${conversationId}`),
    enabled: Boolean(conversationId),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link href="/admin/logs">
          <Button variant="outline" className="w-full rounded-2xl sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <PageHeader
          eyebrow="Admin • Conversa"
          title={data?.userName ?? "Detalhe da conversa"}
          description="Veja a mensagem bruta, transcricao, analise de imagem, dados estruturados e a trilha completa de decisao."
          badge="Plano Contai"
        />

        <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Resumo do processamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <SimpleInfoBadge value={data?.householdName ?? "-"} />
                  <SimpleInfoBadge value={data?.sourceType ?? "-"} />
                  <SimpleInfoBadge value={data?.engine ?? "-"} />
                  <SimpleInfoBadge value={data?.decision ?? "-"} tone="emerald" />
                </div>
                {data?.error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {data.error}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Mensagem e conteudos derivados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Mensagem bruta</p>
                  <p className="mt-2 text-sm text-slate-900">{data?.rawMessage}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Transcricao</p>
                  <p className="mt-2 text-sm text-slate-900">{data?.transcribedContent ?? "Não se aplica"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Analise da imagem</p>
                  <p className="mt-2 text-sm text-slate-900">{data?.imageAnalysis ?? "Não se aplica"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Structured data</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm text-slate-900">{data?.structuredData ?? "Sem estrutura registrada"}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Decisao e resposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Decisao tomada</p>
                  <p className="mt-2 font-semibold text-slate-950">{data?.decision}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Resposta enviada</p>
                  <p className="mt-2 text-sm text-slate-900">{data?.responseSent ?? "Não houve resposta de saida registrada."}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Trilha do processamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {data?.trace.map((item, index) => (
                  <div key={`${item.step}-${index}`} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.step}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
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

