import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson, postJson, BASE_URL } from "@/lib/api";

type GoogleCalendarStatus = {
  connection: {
    id: number;
    googleEmail: string | null;
    status: string;
  } | null;
  oauthConfigured: boolean;
  redirectUri: string;
  canSync: boolean;
};

type SyncResponse = {
  syncedCount: number;
  syncedByType: {
    commitments: number;
    reminders: number;
    bills: number;
  };
  items: Array<{ id: number; title: string; type: "commitment" | "reminder" | "bill"; status: string }>;
};

type QuickConnectResponse = {
  ok: boolean;
  mode: "prepared";
  message: string;
};

export default function AppIntegrationsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.userId ?? 1;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["google-calendar", userId],
    queryFn: () => getJson<GoogleCalendarStatus>(`/google-calendar/${userId}`),
  });

  const syncCalendar = useMutation({
    mutationFn: () => postJson<SyncResponse>(`/google-calendar/${userId}/sync`, {}),
    onSuccess: async (result) => {
      setFeedback(
        result.syncedCount > 0
          ? `${result.syncedCount} item(ns) enviado(s) para o Google Agenda: ${result.syncedByType.commitments} compromisso(s), ${result.syncedByType.reminders} lembrete(s) e ${result.syncedByType.bills} vencimento(s).`
          : "Não encontrei novos compromissos, lembretes ou vencimentos para sincronizar agora.",
      );
      await queryClient.invalidateQueries({ queryKey: ["google-calendar", userId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível sincronizar agora.");
    },
  });

  const quickConnectCalendar = useMutation({
    mutationFn: (email?: string) => postJson<QuickConnectResponse>(`/google-calendar/${userId}/quick-connect`, { email }),
    onSuccess: async (result) => {
      setFeedback(result.message);
      await queryClient.invalidateQueries({ queryKey: ["google-calendar", userId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível ativar a conexão rápida.");
    },
  });

  const disconnectCalendar = useMutation({
    mutationFn: () => postJson<{ ok: boolean }>(`/google-calendar/${userId}/disconnect`, {}),
    onSuccess: async () => {
      setFeedback("Google Agenda desconectado com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["google-calendar", userId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível desconectar agora.");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    const reason = params.get("reason");

    if (!google) {
      return;
    }

    if (google === "connected") {
      setFeedback("Google Agenda conectado com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["google-calendar", userId] });
    }

    if (google === "error") {
      setFeedback(
        reason === "missing_config"
          ? "Faltam credenciais do Google no backend."
          : "Não foi possível concluir a conexão com o Google Agenda.",
      );
    }

    window.history.replaceState({}, "", "/app/integracoes");
  }, [queryClient, userId]);

  const isConnected = data?.connection?.status === "connected";
  const isPrepared = data?.connection?.status === "prepared";
  const statusLabel = useMemo(() => {
    if (!data?.oauthConfigured) {
      return isPrepared ? "Conexão rápida ativa" : "Não configurado";
    }
    return isConnected ? "Conectado" : "Desconectado";
  }, [data?.oauthConfigured, isConnected, isPrepared]);

  function handleConnect() {
    if (!data?.oauthConfigured) {
      quickConnectCalendar.mutate(customEmail);
      return;
    }
    // Passa o e-mail como hint para o Google pré-selecionar a conta desejada
    const hint = customEmail.trim();
    const url = hint
      ? `${BASE_URL}/api/google-calendar/${userId}/connect?hint=${encodeURIComponent(hint)}`
      : `${BASE_URL}/api/google-calendar/${userId}/connect`;
    window.location.href = url;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Integrações"
          title="Conexões da sua conta"
          description="Conecte o Google Agenda para sincronizar compromissos, lembretes e vencimentos do seu acesso."
        />

        <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Google Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-slate-100 px-4 py-4 dark:border-white/10 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {data?.connection?.googleEmail ?? "Conta não conectada"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {isPrepared
                      ? "Conexão rápida ativa. Sua conta já ficou preparada para o Google Agenda."
                      : "Conexão opcional para levar compromissos, lembretes e contas com vencimento para o seu Google Agenda."}
                  </p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/10">
                  {statusLabel}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-slate-100 px-4 py-4 dark:border-white/10 sm:px-5">
                <p className="text-sm text-slate-500 dark:text-slate-300">OAuth</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {data?.oauthConfigured ? "Pronto" : "Conexão rápida disponível"}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 px-4 py-4 dark:border-white/10 sm:px-5">
                <p className="text-sm text-slate-500 dark:text-slate-300">Conta conectada</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {isConnected ? "Sim" : isPrepared ? "Preparada" : "Não"}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-100 px-4 py-4 dark:border-white/10 sm:col-span-2 sm:px-5 xl:col-span-1">
                <p className="text-sm text-slate-500 dark:text-slate-300">Sincronização</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {data?.canSync ? "Tempo, prazo e vencimento" : "Preparando integração"}
                </p>
              </div>
            </div>

            {/* Campo de e-mail: aparece quando OAuth está configurado (para escolher a conta) OU quando não está (conexão rápida) */}
            {!isConnected && !isPrepared && (
              <div className="max-w-sm space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {data?.oauthConfigured
                    ? "E-mail do Google (opcional: deixe em branco para escolher na hora)"
                    : "E-mail para a agenda (opcional)"}
                </p>
                <Input
                  placeholder="ex: seu-email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-white/10"
                />
              </div>
            )}

            {/* Quando já está conectado, permite reconectar com outro e-mail */}
            {isConnected && (
              <div className="max-w-sm space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reconectar com outro e-mail (opcional)
                </p>
                <Input
                  placeholder="ex: outro-email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-white/10"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="rounded-2xl"
                onClick={handleConnect}
                disabled={quickConnectCalendar.isPending}
              >
                {data?.oauthConfigured
                  ? isConnected
                    ? "Reconectar Google Agenda"
                    : "Conectar Google Agenda"
                  : quickConnectCalendar.isPending
                    ? "Ativando..."
                    : "Ativar conexão rápida"}
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => disconnectCalendar.mutate()}
                disabled={(!isConnected && !isPrepared) || disconnectCalendar.isPending}
              >
                Desconectar
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => syncCalendar.mutate()}
                disabled={!data?.canSync || syncCalendar.isPending}
              >
                Sincronizar agenda do Contai
              </Button>
            </div>

            {feedback ? (
              <div className="rounded-3xl border border-slate-100 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300 sm:px-5">
                {feedback}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-100 px-4 py-4 dark:border-white/10 sm:px-5">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Como funciona</p>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">
                Depois de conectar, o Contai pode enviar para o seu Google Agenda tudo o que faz sentido no tempo:
                compromissos, lembretes e contas com vencimento. Gastos e receitas continuam só no Contai, sem poluir sua agenda.
                Cada pessoa da conta conecta a própria agenda separadamente.
                {!data?.oauthConfigured
                  ? " Enquanto o OAuth oficial ainda não estiver ligado, você já pode ativar a conexão rápida para deixar sua conta preparada."
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

