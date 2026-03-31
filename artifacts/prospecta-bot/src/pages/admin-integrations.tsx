import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, RefreshCw, Wifi } from "lucide-react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge } from "@/components/admin-user-badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";

type Integration = {
  key: string;
  name: string;
  status: string;
  lastCheckedAt: string | null;
  lastFailure: string | null;
  environment: string;
  latencyMs: number | null;
};

export default function AdminIntegrationsPage() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: () => getJson<Integration[]>("/admin/integrations"),
  });

  const testMutation = useMutation({
    mutationFn: (service: string) =>
      postJson<{ latencyMs: number; checkedAt: string; message: string }>("/admin/integrations/test", { service }),
    onSuccess: async (result) => {
      setFeedback({ type: "success", message: result.message });
      await refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel testar a conexao agora.",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Integracoes"
          title="Monitoramento de conexoes"
          description="Acompanhe status, latencia, falhas e abra os detalhes para trocar chaves direto pelo painel."
          badge="Plano Contai"
        />

        <Card className="border-white/10 bg-[#0c1622]/90 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <CardHeader>
            <CardTitle>Servicos conectados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback ? (
              <div
                className={`rounded-[24px] border px-4 py-3 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                    : "border-rose-400/30 bg-rose-500/12 text-rose-100"
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            {data?.map((integration) => (
              <div
                key={integration.key}
                className="rounded-[28px] border border-white/10 bg-[#111c28] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.6fr)_minmax(0,240px)]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">{integration.name}</p>
                      <SimpleInfoBadge
                        value={integration.status}
                        tone={integration.status === "connected" ? "emerald" : integration.status === "error" ? "rose" : "slate"}
                      />
                      <SimpleInfoBadge value={integration.environment} />
                    </div>
                    <p className="text-sm text-slate-300">
                      Ultima verificacao:{" "}
                      {integration.lastCheckedAt ? new Date(integration.lastCheckedAt).toLocaleString("pt-BR") : "ainda nao testado"}
                    </p>
                    {integration.lastFailure ? <p className="text-sm text-rose-300">Ultima falha: {integration.lastFailure}</p> : null}
                  </div>

                  <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Latencia</p>
                    <p className="mt-1 font-semibold text-white">{integration.latencyMs ? `${integration.latencyMs} ms` : "sem medicao"}</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[220px] xl:grid-cols-1 xl:self-start">
                    <Button
                      variant="outline"
                      className="justify-start rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      disabled={testMutation.isPending || isFetching}
                      onClick={() => testMutation.mutate(integration.key)}
                    >
                      <Wifi className="h-4 w-4" />
                      {testMutation.isPending && testMutation.variables === integration.key ? "Testando..." : "Testar conexao"}
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      disabled={testMutation.isPending || isFetching}
                      onClick={() => void refetch()}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {isFetching ? "Atualizando..." : "Atualizar status"}
                    </Button>
                    <Link href={`/admin/integrations/${integration.key}`}>
                      <Button
                        variant="outline"
                        className="justify-start rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalhes e chaves
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
