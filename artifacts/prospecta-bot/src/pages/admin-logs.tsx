import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Eye, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getJson, postJson } from "@/lib/api";

type Conversation = {
  id: number;
  userName: string;
  householdName: string;
  memberName: string | null;
  originalContent: string;
  content: string;
  sourceType: string;
  intent: string;
  direction: string;
  createdAt: string;
  processingStatus: string;
  engine: string;
  error: string | null;
};

export default function AdminLogsPage() {
  const [user, setUser] = useState("");
  const [household, setHousehold] = useState("");
  const [intent, setIntent] = useState("");
  const [sourceType, setSourceType] = useState("all");
  const [error, setError] = useState("all");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (user.trim()) params.set("user", user.trim());
    if (household.trim()) params.set("household", household.trim());
    if (intent.trim()) params.set("intent", intent.trim());
    if (sourceType !== "all") params.set("sourceType", sourceType);
    if (error !== "all") params.set("error", error);
    const suffix = params.toString();
    return suffix ? `/admin/conversations?${suffix}` : "/admin/conversations";
  }, [error, household, intent, sourceType, user]);

  const { data, refetch } = useQuery({
    queryKey: ["admin-conversations", query],
    queryFn: () => getJson<Conversation[]>(query),
  });

  const actionMutation = useMutation({
    mutationFn: ({ conversationId, action }: { conversationId: number; action: string }) =>
      postJson(`/admin/conversations/${conversationId}/actions`, { action }),
    onSuccess: () => void refetch(),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Conversas"
          title="Histórico operacional das mensagens"
          description="Filtre por usuário, conta, intenção e erro para revisar processamento, IA e respostas enviadas."
          badge="Plano Contai"
        />

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Busca e filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <Input value={user} onChange={(event) => setUser(event.target.value)} placeholder="Usuário" className="h-11 rounded-2xl bg-white" />
            <Input value={household} onChange={(event) => setHousehold(event.target.value)} placeholder="Household" className="h-11 rounded-2xl bg-white" />
            <Input value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Intenção" className="h-11 rounded-2xl bg-white" />
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="h-11 rounded-2xl bg-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="audio">Áudio</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
              </SelectContent>
            </Select>
            <Select value={error} onValueChange={setError}>
              <SelectTrigger className="h-11 rounded-2xl bg-white">
                <SelectValue placeholder="Erro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Com e sem erro</SelectItem>
                <SelectItem value="true">Somente erro</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conversas processadas</CardTitle>
            <p className="text-sm text-slate-500">{data?.length ?? 0} item(ns)</p>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {data?.map((item) => (
              <div key={item.id} className="rounded-[28px] border border-slate-100 bg-white px-5 py-5 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_minmax(0,240px)]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{item.userName}</p>
                      <SimpleInfoBadge value={item.householdName} />
                      <SimpleInfoBadge value={item.intent} tone="emerald" />
                      <SimpleInfoBadge value={item.sourceType} />
                      <SimpleInfoBadge value={item.engine} />
                    </div>
                    <p className="text-sm text-slate-900">{item.originalContent}</p>
                    <p className="text-sm text-slate-500">
                      Resposta: {item.content || "sem resposta registrada"}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Processamento</p>
                    <p className="mt-1 font-semibold text-slate-900">{item.processingStatus}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                    {item.error ? <p className="mt-2 text-sm text-rose-600">{item.error}</p> : null}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[220px] xl:grid-cols-1 xl:self-start">
                    <Link href={`/admin/conversations/${item.id}`}>
                      <Button variant="outline" className="justify-start rounded-2xl">
                        <Eye className="h-4 w-4" />
                        Ver conversa completa
                      </Button>
                    </Link>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={() => actionMutation.mutate({ conversationId: item.id, action: "reprocess" })}>
                      <RefreshCw className="h-4 w-4" />
                      Reprocessar mensagem
                    </Button>
                    <Button variant="outline" className="justify-start rounded-2xl" onClick={() => navigator.clipboard.writeText(JSON.stringify(item, null, 2))}>
                      <Copy className="h-4 w-4" />
                      Copiar payload
                    </Button>
                    <Button className="justify-start rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => actionMutation.mutate({ conversationId: item.id, action: "resolve" })}>
                      <ShieldCheck className="h-4 w-4" />
                      Marcar como resolvida
                    </Button>
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

