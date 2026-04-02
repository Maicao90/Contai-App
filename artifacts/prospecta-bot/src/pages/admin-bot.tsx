import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BrainCircuit, CalendarClock, Link2, MessageSquareText, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/api";

type BotSettings = {
  botTone: string;
  botReplyPrompt: string;
  botTextInterpretationPrompt: string;
  botImageInterpretationPrompt: string;
  botHelpText: string;
  botUnregisteredAccessMessage: string;
  botInactivePlanMessage: string;
  botGoogleCalendarRequiredForScheduling: boolean;
  botGoogleCalendarConnectionMessage: string;
  googleCalendarEnabled: boolean;
  audioProcessingEnabled: boolean;
  imageProcessingEnabled: boolean;
  monthlyMessageLimit: number;
};

type BotPromptPreview = {
  textSystemPrompt: string;
  imageSystemPrompt: string;
  effectiveTextPrompt: string;
  effectiveImagePrompt: string;
  effectiveReplyPrompt: string;
};

type BotTestResult = {
  scenario: "active" | "unregistered" | "inactive_plan" | "google_required";
  blocked: boolean;
  parsed: {
    intent: string;
    amount?: number;
    category?: string;
    description?: string;
    title?: string;
    notes?: string;
    visibility?: "shared" | "personal";
  };
  reply: string;
};

const defaultSettings: BotSettings = {
  botTone: "",
  botReplyPrompt: "",
  botTextInterpretationPrompt: "",
  botImageInterpretationPrompt: "",
  botHelpText: "",
  botUnregisteredAccessMessage: "",
  botInactivePlanMessage: "",
  botGoogleCalendarRequiredForScheduling: true,
  botGoogleCalendarConnectionMessage: "",
  googleCalendarEnabled: true,
  audioProcessingEnabled: true,
  imageProcessingEnabled: true,
  monthlyMessageLimit: 0,
};

export default function AdminBotPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-bot-settings"],
    queryFn: () => getJson<BotSettings>("/admin/system-settings"),
  });

  const promptPreviewQuery = useQuery({
    queryKey: ["admin-bot-prompt-preview"],
    queryFn: () => getJson<BotPromptPreview>("/admin/bot/prompt-preview"),
  });

  const [form, setForm] = useState<BotSettings>(defaultSettings);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testScenario, setTestScenario] = useState<BotTestResult["scenario"]>("active");
  const [testMessage, setTestMessage] = useState("gastei 42 no posto");
  const [testResult, setTestResult] = useState<BotTestResult | null>(null);

  function renderPromptBlock(value?: string) {
    if (promptPreviewQuery.isPending) {
      return "Carregando prompt...";
    }

    if (promptPreviewQuery.isError) {
      return "Nao foi possivel carregar o prompt completo agora. Recarregue a pagina ou entre novamente no admin.";
    }

    return value?.trim() || "Nenhum prompt configurado ainda.";
  }

  useEffect(() => {
    if (data) {
      setForm({
        botTone: data.botTone ?? "",
        botReplyPrompt: data.botReplyPrompt ?? "",
        botTextInterpretationPrompt: data.botTextInterpretationPrompt ?? "",
        botImageInterpretationPrompt: data.botImageInterpretationPrompt ?? "",
        botHelpText: data.botHelpText ?? "",
        botUnregisteredAccessMessage: data.botUnregisteredAccessMessage ?? "",
        botInactivePlanMessage: data.botInactivePlanMessage ?? "",
        botGoogleCalendarRequiredForScheduling: data.botGoogleCalendarRequiredForScheduling ?? true,
        botGoogleCalendarConnectionMessage: data.botGoogleCalendarConnectionMessage ?? "",
        googleCalendarEnabled: data.googleCalendarEnabled ?? true,
        audioProcessingEnabled: data.audioProcessingEnabled ?? true,
        imageProcessingEnabled: data.imageProcessingEnabled ?? true,
        monthlyMessageLimit: data.monthlyMessageLimit ?? 0,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: BotSettings) => postJson("/admin/system-settings", payload),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Painel do bot atualizado com sucesso." });
      await refetch();
      await promptPreviewQuery.refetch();
    },
    onError: () => {
      setFeedback({ type: "error", message: "Nao foi possivel salvar as configuracoes do bot agora." });
    },
  });

  const testMutation = useMutation({
    mutationFn: () =>
      postJson<BotTestResult>("/admin/bot/test-message", {
        scenario: testScenario,
        message: testMessage,
      }),
    onSuccess: (result) => {
      setTestResult(result);
      setFeedback({ type: "success", message: "Teste do bot executado com sucesso." });
    },
    onError: () => {
      setFeedback({ type: "error", message: "Nao foi possivel testar o bot agora." });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Bot"
          title="Controle total do bot do Contai"
          description="Edite interpretacao, resposta, ajuda, regras de agenda e comportamento operacional do bot direto do admin."
          badge="Motor do WhatsApp"
        />

        <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
          <CardHeader>
            <CardTitle className="text-white">Acesso rapido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            <Link href="/admin/integrations">
              <div className="cursor-pointer rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10">
                <div className="flex items-center gap-3 text-white">
                  <Link2 className="h-4 w-4 text-emerald-300" />
                  <p className="font-medium">Integracoes do admin</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Colar chaves, testar conexoes e validar Meta, OpenAI, Google Agenda, Cakto e SMTP.</p>
              </div>
            </Link>
            <Link href="/app/integracoes">
              <div className="cursor-pointer rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10">
                <div className="flex items-center gap-3 text-white">
                  <CalendarClock className="h-4 w-4 text-emerald-300" />
                  <p className="font-medium">Tela do usuario</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Veja como a pessoa conecta o Google Agenda e confirma a jornada que o bot vai orientar.</p>
              </div>
            </Link>
            <Link href="/login?next=/app/integracoes">
              <div className="cursor-pointer rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10">
                <div className="flex items-center gap-3 text-white">
                  <MessageSquareText className="h-4 w-4 text-emerald-300" />
                  <p className="font-medium">Link de login guiado</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Use este caminho quando o bot precisar mandar a pessoa logar e seguir direto para integrar a agenda.</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <div className="space-y-6">
            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquareText className="h-5 w-5 text-emerald-300" />
                  Acesso e bloqueios do bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Mensagem para numero sem cadastro</p>
                  <Textarea
                    value={form.botUnregisteredAccessMessage}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, botUnregisteredAccessMessage: event.target.value }))
                    }
                    className="min-h-28 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Mensagem para cadastro sem plano ativo</p>
                  <Textarea
                    value={form.botInactivePlanMessage}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, botInactivePlanMessage: event.target.value }))
                    }
                    className="min-h-28 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Mensagem de orientacao para conectar o Google Agenda</p>
                  <Textarea
                    value={form.botGoogleCalendarConnectionMessage}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, botGoogleCalendarConnectionMessage: event.target.value }))
                    }
                    className="min-h-36 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                  Resposta final do bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Tom geral</p>
                  <Textarea
                    value={form.botTone}
                    onChange={(event) => setForm((current) => ({ ...current, botTone: event.target.value }))}
                    className="min-h-24 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Prompt de resposta</p>
                  <Textarea
                    value={form.botReplyPrompt}
                    onChange={(event) => setForm((current) => ({ ...current, botReplyPrompt: event.target.value }))}
                    className="min-h-40 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Mensagem de ajuda</p>
                  <Textarea
                    value={form.botHelpText}
                    onChange={(event) => setForm((current) => ({ ...current, botHelpText: event.target.value }))}
                    className="min-h-28 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BrainCircuit className="h-5 w-5 text-emerald-300" />
                  Interpretacao da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Prompt de texto</p>
                  <Textarea
                    value={form.botTextInterpretationPrompt}
                    onChange={(event) => setForm((current) => ({ ...current, botTextInterpretationPrompt: event.target.value }))}
                    className="min-h-36 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Prompt de imagem</p>
                  <Textarea
                    value={form.botImageInterpretationPrompt}
                    onChange={(event) => setForm((current) => ({ ...current, botImageInterpretationPrompt: event.target.value }))}
                    className="min-h-32 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CalendarClock className="h-5 w-5 text-emerald-300" />
                  Agenda e Google
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">Exigir Google Agenda para agendar</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Quando ativo, o bot nao salva compromisso se a agenda da pessoa nao estiver conectada.</p>
                  </div>
                  <Switch
                    checked={form.botGoogleCalendarRequiredForScheduling}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, botGoogleCalendarRequiredForScheduling: checked }))
                    }
                  />
                </label>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Recursos ligados no bot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-2">
                <label className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Google Agenda</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Permite a jornada de conexao e sincronizacao do calendario.</p>
                  </div>
                  <Switch
                    checked={form.googleCalendarEnabled}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, googleCalendarEnabled: checked }))}
                  />
                </label>
                <label className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Audio</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Liga a escuta e transcricao de mensagens de voz.</p>
                  </div>
                  <Switch
                    checked={form.audioProcessingEnabled}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, audioProcessingEnabled: checked }))}
                  />
                </label>
                <label className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">Imagem</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">Liga leitura de comprovantes, recibos, notas e prints.</p>
                  </div>
                  <Switch
                    checked={form.imageProcessingEnabled}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, imageProcessingEnabled: checked }))}
                  />
                </label>
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-slate-400">Limite mensal de mensagens</p>
                  <Input
                    value={String(form.monthlyMessageLimit)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        monthlyMessageLimit: Number(event.target.value.replace(/\D/g, "")) || 0,
                      }))
                    }
                    className="mt-3 h-11 rounded-2xl border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Teste de mensagem do bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Cenario</p>
                  <select
                    value={testScenario}
                    onChange={(event) => setTestScenario(event.target.value as BotTestResult["scenario"])}
                    className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
                  >
                    <option value="active" className="bg-slate-950 text-white">
                      Cliente ativo e liberado
                    </option>
                    <option value="unregistered" className="bg-slate-950 text-white">
                      Numero sem cadastro
                    </option>
                    <option value="inactive_plan" className="bg-slate-950 text-white">
                      Cadastro sem plano ativo
                    </option>
                    <option value="google_required" className="bg-slate-950 text-white">
                      Agendamento sem Google Agenda
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Mensagem para testar</p>
                  <Textarea
                    value={testMessage}
                    onChange={(event) => setTestMessage(event.target.value)}
                    className="min-h-28 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={testMutation.isPending}
                  onClick={() => testMutation.mutate()}
                >
                  {testMutation.isPending ? "Testando resposta..." : "Testar mensagem do bot"}
                </Button>

                {testResult ? (
                  <div className="space-y-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
                      <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-slate-300">
                        Intencao: {testResult.parsed.intent}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 ${
                          testResult.blocked
                            ? "border border-amber-300/20 bg-amber-400/10 text-amber-100"
                            : "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                        }`}
                      >
                        {testResult.blocked ? "Resposta bloqueada" : "Resposta liberada"}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-200">
                      {testResult.reply}
                    </pre>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-6 text-slate-400">
                      <p>Esse teste usa a mesma base de prompts e regras do bot, mas nao salva gasto, receita, conta ou compromisso.</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Prompt completo do bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-medium text-white">Prompt efetivo de resposta</p>
                  <pre className="mt-3 max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                    {renderPromptBlock(promptPreviewQuery.data?.effectiveReplyPrompt)}
                  </pre>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-medium text-white">Prompt efetivo de interpretacao de texto</p>
                  <pre className="mt-3 max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                    {renderPromptBlock(promptPreviewQuery.data?.effectiveTextPrompt)}
                  </pre>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-medium text-white">Prompt efetivo de interpretacao de imagem</p>
                  <pre className="mt-3 max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-300">
                    {renderPromptBlock(promptPreviewQuery.data?.effectiveImagePrompt)}
                  </pre>
                </div>
                {promptPreviewQuery.isError ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                    onClick={() => void promptPreviewQuery.refetch()}
                  >
                    Tentar carregar de novo
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Jornada de agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
                <p>1. O cliente pede para agendar algo no WhatsApp.</p>
                <p>2. Se o Google Agenda nao estiver conectado, o bot responde com a mensagem que voce definiu acima.</p>
                <p>3. O cliente recebe o link de login ou de integracoes e segue para conectar a agenda.</p>
                <p>4. Depois da conexao, ele volta a pedir o compromisso e o bot salva normalmente.</p>
              </CardContent>
            </Card>

            {feedback ? (
              <div
                className={`rounded-3xl border px-5 py-4 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Salvar tudo do bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-300">Esse painel controla o jeito que o bot entende, responde, ajuda o usuario e trata a jornada de agendamento.</p>
                <Button
                  className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(form)}
                >
                  {mutation.isPending ? "Salvando painel do bot..." : "Salvar configuracoes do bot"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
