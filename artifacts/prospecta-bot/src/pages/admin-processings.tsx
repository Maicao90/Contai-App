import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AudioLines, FileSearch, MessageSquareText, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getJson, postJson } from "@/lib/api";

type ProcessingResponse = {
  metrics: {
    textProcessed: number;
    audioProcessed: number;
    imageProcessed: number;
    pendingOpen: number;
    transcriptionFailures: number;
    visionFailures: number;
    interpretationFailures: number;
    reprocessings: number;
  };
  items: Array<{
    id: number;
    userName: string;
    householdName: string;
    type: string;
    reason: string;
    originalMessage: string;
    status: string;
    createdAt: string;
    conversationId: number | null;
  }>;
  latestErrors: Array<{
    id: number;
    userName: string;
    type: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  awaitingComplement: Array<{
    id: number;
    userName: string;
    type: string;
    reason: string;
    createdAt: string;
  }>;
};

export default function AdminProcessingsPage() {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    const suffix = params.toString();
    return suffix ? `/admin/processings?${suffix}` : "/admin/processings";
  }, [status, type]);

  const { data, refetch } = useQuery({
    queryKey: ["admin-processings", query],
    queryFn: () => getJson<ProcessingResponse>(query),
  });

  const actionMutation = useMutation({
    mutationFn: ({ processingId, action }: { processingId: number; action: string }) =>
      postJson(`/admin/processings/${processingId}/actions`, { action }),
    onSuccess: () => void refetch(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin · Processamentos"
          title="Pipeline operacional de texto, audio e imagem"
          description="Veja pendencias, falhas, reprocessamentos e itens aguardando complemento em uma unica fila."
          badge="Plano Contai"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Texto" value={String(data?.metrics.textProcessed ?? 0)} helper="Entradas textuais processadas" icon={MessageSquareText} tone="slate" />
          <MetricCard title="Audio" value={String(data?.metrics.audioProcessed ?? 0)} helper="Arquivos com transcricao" icon={AudioLines} tone="slate" />
          <MetricCard title="Imagem" value={String(data?.metrics.imageProcessed ?? 0)} helper="Itens com visao processada" icon={FileSearch} tone="slate" />
          <MetricCard title="Pendencias" value={String(data?.metrics.pendingOpen ?? 0)} helper="Itens aguardando complemento" icon={RefreshCw} tone="slate" />
        </section>

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:max-w-lg">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 rounded-2xl bg-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="intent">Intenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 rounded-2xl bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="processed">Processado</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Itens operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.items.map((item) => (
                <div key={item.id} className="rounded-[28px] border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{item.userName}</p>
                        <SimpleInfoBadge value={item.householdName} />
                        <SimpleInfoBadge value={item.type} />
                        <SimpleInfoBadge value={item.status} tone={item.status === "processed" ? "emerald" : "slate"} />
                      </div>
                      <p className="text-sm text-slate-900">{item.reason}</p>
                      <p className="text-sm text-slate-500">{item.originalMessage}</p>
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[220px] xl:grid-cols-1 xl:self-start">
                      <Button variant="outline" className="justify-start rounded-2xl" onClick={() => actionMutation.mutate({ processingId: item.id, action: "reprocess" })}>
                        <RefreshCw className="h-4 w-4" />
                        Reprocessar
                      </Button>
                      <Button variant="outline" className="justify-start rounded-2xl" onClick={() => actionMutation.mutate({ processingId: item.id, action: "discard" })}>
                        <Trash2 className="h-4 w-4" />
                        Descartar
                      </Button>
                      {item.conversationId ? (
                        <Link href={`/admin/conversations/${item.conversationId}`}>
                          <Button variant="outline" className="justify-start rounded-2xl">
                            <MessageSquareText className="h-4 w-4" />
                            Abrir conversa
                          </Button>
                        </Link>
                      ) : null}
                      <Button className="justify-start rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => actionMutation.mutate({ processingId: item.id, action: "resolve" })}>
                        <ShieldCheck className="h-4 w-4" />
                        Resolver manualmente
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Falhas e reprocessamentos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Falhas de transcricao</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.metrics.transcriptionFailures ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Falhas de visao</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.metrics.visionFailures ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Falhas de interpretacao</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.metrics.interpretationFailures ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Reprocessamentos</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.metrics.reprocessings ?? 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Ultimos erros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {data?.latestErrors.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3">
                    <p className="font-medium text-rose-700">{item.userName}</p>
                    <p className="mt-1 text-sm text-rose-600">{item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Aguardando complemento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {data?.awaitingComplement.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.userName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.reason}</p>
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
