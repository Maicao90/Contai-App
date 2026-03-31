import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, RefreshCw, Save, Wifi } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getJson, postJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type IntegrationField = {
  key: string;
  label: string;
  placeholder: string;
  value?: string;
  valueMasked?: string;
  configured?: boolean;
  helpText?: string;
  required?: boolean;
  secret?: boolean;
};

type IntegrationDetail = {
  key?: string;
  name?: string;
  status?: string;
  lastCheckedAt?: string | null;
  lastFailure?: string | null;
  lastResponse?: string | null;
  history?: Array<{ status?: string; message?: string; at?: string }>;
  latestSync?: string | null;
  hints?: Array<{ label: string; value: string }>;
  fields?: IntegrationField[];
  configuredCount?: number;
  totalFields?: number;
};

export default function AdminIntegrationDetailPage() {
  const [match, params] = useRoute("/admin/integrations/:key");
  const integrationKey = match ? params.key : null;
  const [form, setForm] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { toast } = useToast();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-integration-detail", integrationKey],
    queryFn: () => getJson<IntegrationDetail>(`/admin/integrations/${integrationKey}`),
    enabled: Boolean(integrationKey),
  });

  const fields = Array.isArray(data?.fields) ? data.fields : [];
  const history = Array.isArray(data?.history) ? data.history : [];
  const hints = Array.isArray(data?.hints) ? data.hints : [];

  useEffect(() => {
    if (!data) return;

    setForm(
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = field.value ?? "";
        return acc;
      }, {}),
    );
  }, [data, fields]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      postJson<{ ok: boolean; message: string }>(`/admin/integrations/${integrationKey}/settings`, { values: payload }),
    onSuccess: async (result) => {
      setFeedback({ type: "success", message: result.message });
      toast({ title: "Sucesso", description: result.message });
      await refetch();
    },
    onError: (error: any) => {
      const msg = error.message || "Nao foi possivel salvar as chaves agora.";
      setFeedback({ type: "error", message: msg });
      toast({ variant: "destructive", title: "Falha ao salvar", description: msg });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      postJson<{ ok: boolean; message: string }>(`/admin/integrations/${integrationKey}/settings`, {
        values: fields.reduce<Record<string, string>>((acc, field) => {
          acc[field.key] = "";
          return acc;
        }, {}),
      }),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Integracao limpa. As chaves foram removidas." });
      setForm(
        fields.reduce<Record<string, string>>((acc, field) => {
          acc[field.key] = "";
          return acc;
        }, {}),
      );
      await refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel limpar a integracao agora.",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => postJson<{ message: string }>("/admin/integrations/test", { service: integrationKey }),
    onSuccess: async (result) => {
      setFeedback({ type: "success", message: result.message });
      toast({ title: "Conexao estabelecida!", description: result.message });
      await refetch();
    },
    onError: (error: any) => {
      const msg = error.message || "Nao foi possivel testar a conexao agora.";
      setFeedback({ type: "error", message: msg });
      toast({ variant: "destructive", title: "Erro de Conexao", description: msg });
    },
  });

  function updateField(fieldKey: string, value: string) {
    setForm((current) => ({ ...current, [fieldKey]: value }));
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Link href="/admin/integrations">
          <Button variant="outline" className="rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <PageHeader
          eyebrow="Admin • Integracoes"
          title={data?.name ?? "Detalhes da integracao"}
          description="Edite as credenciais no painel, valide a conexao e acompanhe o historico mais recente dessa integracao."
          badge="Plano Contai"
        />

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-950/70">
            <CardHeader>
              <CardTitle>Chaves e configuracao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-hidden">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 px-4 py-4">
                  <p className="text-sm text-slate-300">Status</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <SimpleInfoBadge
                      value={data?.status ?? "-"}
                      tone={data?.status === "connected" ? "emerald" : data?.status === "error" ? "rose" : "slate"}
                    />
                    <SimpleInfoBadge value={`${data?.configuredCount ?? 0}/${data?.totalFields ?? 0} campos`} />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 px-4 py-4">
                  <p className="text-sm text-slate-300">Ultimo teste</p>
                  <p className="mt-2 text-sm text-white">
                    {data?.lastCheckedAt ? new Date(data.lastCheckedAt).toLocaleString("pt-BR") : "Ainda nao testado"}
                  </p>
                </div>
              </div>

              {fields.length ? (
                <div className="grid gap-4">
                  {fields.map((field) => {
                    const isRevealed = revealed[field.key] ?? !field.secret;

                    return (
                      <div key={field.key} className="min-w-0 rounded-3xl border border-white/10 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-white">{field.label}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {field.helpText ?? "Configure esse valor para ativar a integracao."}
                            </p>
                          </div>
                          {field.required ? (
                            <SimpleInfoBadge value="Obrigatorio" tone="emerald" />
                          ) : (
                            <SimpleInfoBadge value="Opcional" />
                          )}
                        </div>

                        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row">
                          <Input
                            type={field.secret && !isRevealed ? "password" : "text"}
                            value={form[field.key] ?? ""}
                            placeholder={field.placeholder}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            className="min-w-0 h-12 rounded-2xl border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500"
                          />
                          {field.secret ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 shrink-0 rounded-2xl border-white/10 bg-slate-900/70 px-4 text-white hover:bg-slate-900 sm:w-auto"
                              onClick={() =>
                                setRevealed((current) => ({ ...current, [field.key]: !current[field.key] }))
                              }
                            >
                              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          ) : null}
                        </div>

                        <p className="mt-2 break-all text-xs leading-5 text-slate-400">
                          Atual:{" "}
                          {field.configured
                            ? field.secret
                              ? field.valueMasked || "preenchido"
                              : field.value || "preenchido"
                            : "nao configurado"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-300">
                  Essa integracao ainda nao devolveu os campos editaveis. Atualize o backend e recarregue a pagina.
                </div>
              )}

              {feedback ? (
                <div
                  className={`rounded-3xl border px-4 py-4 text-sm ${
                    feedback.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-4 2xl:sticky 2xl:top-8 2xl:self-start">
            <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle>Acoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start rounded-2xl"
                  disabled={saveMutation.isPending || clearMutation.isPending || isLoading || !fields.length}
                  onClick={() => saveMutation.mutate(form)}
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar chaves"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-2xl"
                  disabled={testMutation.isPending || isLoading}
                  onClick={() => testMutation.mutate()}
                >
                  <Wifi className="h-4 w-4" />
                  {testMutation.isPending ? "Testando..." : "Testar conexao"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-2xl"
                  disabled={clearMutation.isPending || saveMutation.isPending || isLoading || !fields.length}
                  onClick={() => clearMutation.mutate()}
                >
                  {clearMutation.isPending ? "Limpando..." : "Limpar integracao"}
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={() => void refetch()}>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar status
                </Button>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle>Diagnostico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-3xl border border-white/10 px-4 py-4">
                  <p className="text-slate-300">Ultima resposta</p>
                  <div className="mt-2 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="whitespace-pre-wrap break-all text-white">
                      {data?.lastResponse ?? "Sem retorno registrado ainda."}
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 px-4 py-4">
                  <p className="text-slate-300">Ultima sincronizacao</p>
                  <p className="mt-2 text-white">
                    {data?.latestSync ? new Date(data.latestSync).toLocaleString("pt-BR") : "Nao se aplica"}
                  </p>
                </div>
                {data?.lastFailure ? (
                  <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-rose-100">
                    {data.lastFailure}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle>Links e dados uteis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {hints.length ? (
                  hints.map((hint) => (
                    <div key={hint.label} className="rounded-3xl border border-white/10 px-4 py-4">
                      <p className="text-slate-300">{hint.label}</p>
                      <p className="mt-2 break-all text-white">{hint.value}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-300">
                    Sem dados auxiliares para mostrar nessa integracao.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle>Historico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.length ? (
                  history.map((item, index) => (
                    <div key={index} className="rounded-3xl border border-white/10 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <SimpleInfoBadge
                          value={item.status ?? "status"}
                          tone={item.status === "connected" ? "emerald" : item.status === "error" ? "rose" : "slate"}
                        />
                        <span className="text-xs text-slate-400">
                          {item.at ? new Date(item.at).toLocaleString("pt-BR") : "-"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white">{item.message ?? "Sem mensagem detalhada."}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-300">
                    Ainda nao ha historico registrado para essa integracao.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
