import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Mail, RotateCcw, Send, Settings2 } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/api";

type EmailTemplate = {
  key: string;
  title: string;
  description: string;
  subject: string;
  text: string;
  html: string;
};

type EmailRecipient = {
  id: number;
  name: string;
  email: string;
  householdId: number | null;
};

type EmailEvent = {
  id: number;
  type: string;
  recipient: string | null;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  payload: Record<string, unknown> | null;
};

type Integration = {
  key: string;
  name: string;
  status: string;
  lastCheckedAt: string | null;
  lastFailure: string | null;
  environment: string;
  latencyMs: number | null;
};

type DraftPreview = {
  subject: string;
  preview: string;
  text: string;
  html: string;
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value || "{}") as Record<string, unknown>;
  } catch {
    return null;
  }
}

function renderTemplateValue(template: string, context: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => context[key] ?? "");
}

function buildLocalEmailPreview(input: {
  subject: string;
  text: string;
  html: string;
  context: Record<string, string>;
}) {
  const appBaseUrl =
    typeof window === "undefined" ? "https://contai.site" : window.location.origin;
  const subject = renderTemplateValue(input.subject, input.context) || "Preview do Contai";
  const text = renderTemplateValue(input.text, input.context);
  const htmlContent =
    renderTemplateValue(input.html, input.context) ||
    `<p>${text.replace(/\n/g, "<br />")}</p>`;
  const preview = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <meta name="description" content="${preview}" />
    </head>
    <body style="margin:0;padding:0;background:#07110f;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07110f;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#0b1620;border:1px solid rgba(148,163,184,0.16);border-radius:28px;overflow:hidden;">
              <tr>
                <td align="center" style="padding:32px 24px 18px 24px;background:linear-gradient(135deg,#0b1620 0%,#10221b 100%);">
                  <img src="${appBaseUrl}/favicon.png?v=4" alt="Contai" width="84" height="84" style="display:block;width:84px;height:84px;border-radius:24px;margin:0 auto 16px auto;" />
                  <div style="font-size:28px;line-height:1.1;font-weight:700;color:#f8fafc;margin-bottom:8px;">Contai</div>
                  <div style="font-size:13px;line-height:1.6;color:#94a3b8;max-width:420px;margin:0 auto;">Seu financeiro e sua rotina organizados no WhatsApp.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 24px 32px 24px;color:#e2e8f0;font-size:15px;line-height:1.8;">
                  ${htmlContent}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export default function AdminEmailsPage() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [templateForm, setTemplateForm] = useState<EmailTemplate | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [payloadJson, setPayloadJson] = useState("{}");
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [customRecipient, setCustomRecipient] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customText, setCustomText] = useState("");
  const [customHtml, setCustomHtml] = useState("");

  const templatesQuery = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: () => getJson<{ templates: EmailTemplate[] }>("/notifications/templates"),
  });

  const recipientsQuery = useQuery({
    queryKey: ["admin-email-recipients"],
    queryFn: () => getJson<EmailRecipient[]>("/notifications/recipients"),
  });

  const historyQuery = useQuery({
    queryKey: ["admin-email-history"],
    queryFn: () => getJson<EmailEvent[]>("/notifications/history?limit=40"),
  });

  const integrationsQuery = useQuery({
    queryKey: ["admin-integrations-email"],
    queryFn: () => getJson<Integration[]>("/admin/integrations"),
  });

  const emailIntegration = useMemo(
    () => integrationsQuery.data?.find((item) => item.key === "email") ?? null,
    [integrationsQuery.data],
  );

  useEffect(() => {
    const firstTemplate = templatesQuery.data?.templates?.[0];
    if (!selectedTemplateKey && firstTemplate) {
      setSelectedTemplateKey(firstTemplate.key);
      setTemplateForm(firstTemplate);
    }
  }, [selectedTemplateKey, templatesQuery.data]);

  useEffect(() => {
    if (!selectedTemplateKey || !templatesQuery.data?.templates) return;
    const found = templatesQuery.data.templates.find((item) => item.key === selectedTemplateKey);
    if (found) {
      setTemplateForm(found);
    }
  }, [selectedTemplateKey, templatesQuery.data]);

  const saveTemplateMutation = useMutation({
    mutationFn: (payload: EmailTemplate) =>
      postJson(`/notifications/templates/${payload.key}`, {
        title: payload.title,
        description: payload.description,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Template de e-mail salvo com sucesso." });
      await templatesQuery.refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o template agora.",
      });
    },
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      postJson<DraftPreview>("/notifications/preview", {
        template: selectedTemplateKey,
        userId: Number(selectedUserId),
        payload: safeParseJson(payloadJson) ?? {},
      }),
    onSuccess: (result) => {
      setPreview(result);
      setFeedback({ type: "success", message: "Preview do e-mail gerado com sucesso." });
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel gerar o preview agora.",
      });
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: () =>
      postJson("/notifications/send-template", {
        template: selectedTemplateKey,
        userId: Number(selectedUserId),
        payload: safeParseJson(payloadJson) ?? {},
      }),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "E-mail do template disparado com sucesso." });
      await historyQuery.refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel disparar o template agora.",
      });
    },
  });

  const customEmailMutation = useMutation({
    mutationFn: () =>
      postJson("/notifications/send-custom", {
        userId: selectedUserId ? Number(selectedUserId) : null,
        recipient: customRecipient,
        subject: customSubject,
        text: customText,
        html: customHtml,
      }),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "E-mail livre enviado para a fila com sucesso." });
      setCustomSubject("");
      setCustomText("");
      setCustomHtml("");
      await historyQuery.refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel enviar o e-mail livre agora.",
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => postJson(`/notifications/${id}/retry`, {}),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Tentativa de reenvio executada com sucesso." });
      await historyQuery.refetch();
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel reenviar este e-mail agora.",
      });
    },
  });

  const selectedRecipient = useMemo(
    () => recipientsQuery.data?.find((item) => String(item.id) === selectedUserId) ?? null,
    [recipientsQuery.data, selectedUserId],
  );
  const samplePayload = useMemo(() => safeParseJson(payloadJson) ?? {}, [payloadJson]);
  const livePreviewContext = useMemo(
    () => ({
      userName: selectedRecipient?.name ?? "Cliente Contai",
      appBaseUrl: typeof window === "undefined" ? "https://contai.site" : window.location.origin,
      resetUrl:
        String(samplePayload.resetUrl ?? "") ||
        `${typeof window === "undefined" ? "https://contai.site" : window.location.origin}/redefinir-senha?token=preview`,
      amountLabel: String(samplePayload.amountLabel ?? samplePayload.amount ?? "R$99,90"),
      cycleLabel: String(samplePayload.cycleLabel ?? samplePayload.cycle ?? "anual"),
      previousCycleLabel: String(samplePayload.previousCycleLabel ?? samplePayload.previousCycle ?? "mensal"),
      newCycleLabel: String(samplePayload.newCycleLabel ?? samplePayload.newCycle ?? "anual"),
      renewalDate: String(samplePayload.renewalDate ?? "30/04/2026"),
      reportSummary: String(samplePayload.reportSummary ?? samplePayload.summary ?? "Resumo do mes: 12 gastos, 3 contas e 2 compromissos organizados no Contai."),
      meetingTitle: String(samplePayload.meetingTitle ?? samplePayload.title ?? "Reuniao com Marcelo"),
      meetingDate: String(samplePayload.meetingDate ?? samplePayload.date ?? "14/04/2026"),
      googleCalendarStatusLine: String(
        samplePayload.googleCalendarStatusLine ??
          (samplePayload.googleCalendarConnected
            ? "Ele tambem foi sincronizado com o seu Google Agenda."
            : "Para sincronizar proximos compromissos, conecte seu Google Agenda no painel."),
      ),
    }),
    [samplePayload, selectedRecipient],
  );
  const liveTemplatePreview = useMemo(
    () =>
      templateForm
        ? buildLocalEmailPreview({
            subject: templateForm.subject,
            text: templateForm.text,
            html: templateForm.html,
            context: livePreviewContext,
          })
        : "",
    [livePreviewContext, templateForm],
  );

  useEffect(() => {
    if (selectedRecipient && !customRecipient) {
      setCustomRecipient(selectedRecipient.email);
    }
  }, [selectedRecipient, customRecipient]);

  function appendHtmlSnippet(snippet: string) {
    setTemplateForm((current) =>
      current
        ? {
            ...current,
            html: current.html.trim() ? `${current.html}\n\n${snippet}` : snippet,
          }
        : current,
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • E-mails"
          title="Central de e-mails do Contai"
          description="Monte os e-mails no painel, veja o preview visual, acompanhe os envios e valide se o SMTP esta entregando tudo em dia."
          badge="SMTP e notificacoes"
        />

        <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
          <CardHeader>
            <CardTitle className="text-white">Status do envio</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">
                {emailIntegration?.status === "connected" ? "SMTP validado" : "SMTP precisa de configuracao"}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                {emailIntegration?.status === "connected"
                  ? `Ultima verificacao: ${emailIntegration.lastCheckedAt ? new Date(emailIntegration.lastCheckedAt).toLocaleString("pt-BR") : "sem registro"}`
                  : "O envio real depende de preencher e testar a integracao de e-mail transacional."}
              </p>
              <p className="text-sm leading-6 text-slate-300">
                A logo do Contai ja sai centralizada no topo do e-mail. Aqui no painel voce edita o assunto, o texto e o HTML interno do corpo.
              </p>
              {emailIntegration?.lastFailure ? (
                <p className="text-sm text-rose-300">{emailIntegration.lastFailure}</p>
              ) : null}
            </div>
            <Link href="/admin/integrations/email">
              <Button className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600">
                <Settings2 className="h-4 w-4" />
                Abrir integracao SMTP
              </Button>
            </Link>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,1fr)]">
          <div className="space-y-6">
            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Editar templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Template</p>
                  <select
                    value={selectedTemplateKey}
                    onChange={(event) => setSelectedTemplateKey(event.target.value)}
                    className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
                  >
                    {templatesQuery.data?.templates.map((template) => (
                      <option key={template.key} value={template.key} className="bg-slate-950 text-white">
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Nome interno</p>
                    <Input
                      value={templateForm?.title ?? ""}
                      onChange={(event) =>
                        setTemplateForm((current) => (current ? { ...current, title: event.target.value } : current))
                      }
                      className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">Descricao</p>
                    <Input
                      value={templateForm?.description ?? ""}
                      onChange={(event) =>
                        setTemplateForm((current) => (current ? { ...current, description: event.target.value } : current))
                      }
                      className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Assunto</p>
                  <Input
                    value={templateForm?.subject ?? ""}
                    onChange={(event) =>
                      setTemplateForm((current) => (current ? { ...current, subject: event.target.value } : current))
                    }
                    className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Texto puro</p>
                  <Textarea
                    value={templateForm?.text ?? ""}
                    onChange={(event) =>
                      setTemplateForm((current) => (current ? { ...current, text: event.target.value } : current))
                    }
                    className="min-h-40 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">HTML do corpo</p>
                  <Textarea
                    value={templateForm?.html ?? ""}
                    onChange={(event) =>
                      setTemplateForm((current) => (current ? { ...current, html: event.target.value } : current))
                    }
                    className="min-h-56 rounded-2xl border-white/10 bg-white/5 font-mono text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-medium text-white">Blocos prontos para montar o e-mail</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() =>
                        appendHtmlSnippet(
                          `<div style="text-align:center;margin:24px 0;"><img src="https://contai.app/favicon.png" alt="Imagem" width="180" style="display:inline-block;max-width:100%;border-radius:18px;" /></div>`,
                        )
                      }
                    >
                      Imagem centralizada
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() =>
                        appendHtmlSnippet(
                          `<div style="text-align:center;margin:28px 0;"><a href="{{appBaseUrl}}/login" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;">Abrir Contai</a></div>`,
                        )
                      }
                    >
                      Botao CTA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() =>
                        appendHtmlSnippet(
                          `<div style="margin:22px 0;padding:18px 20px;border:1px solid rgba(16,185,129,0.18);border-radius:22px;background:rgba(16,185,129,0.08);"><strong style="display:block;color:#ffffff;margin-bottom:8px;">Bloco de destaque</strong><span style="color:#cbd5e1;">Escreva aqui o ponto principal do e-mail.</span></div>`,
                        )
                      }
                    >
                      Bloco destaque
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                      onClick={() =>
                        appendHtmlSnippet(
                          `<div style="height:1px;background:rgba(148,163,184,0.16);margin:24px 0;"></div>`,
                        )
                      }
                    >
                      Separador
                    </Button>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-300">
                  Variaveis uteis: {"{{userName}}"}, {"{{appBaseUrl}}"}, {"{{resetUrl}}"}, {"{{amountLabel}}"}, {"{{cycleLabel}}"}, {"{{previousCycleLabel}}"}, {"{{newCycleLabel}}"}, {"{{renewalDate}}"}, {"{{reportSummary}}"}, {"{{meetingTitle}}"}, {"{{meetingDate}}"}, {"{{googleCalendarStatusLine}}"}.
                </div>

                <Button
                  className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={!templateForm || saveTemplateMutation.isPending}
                  onClick={() => templateForm && saveTemplateMutation.mutate(templateForm)}
                >
                  {saveTemplateMutation.isPending ? "Salvando template..." : "Salvar template"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Historico de envios</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
                {historyQuery.data?.map((item) => (
                  <div key={item.id} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="break-words font-medium text-white">{item.subject}</p>
                        <p className="text-sm text-slate-300">{item.recipient ?? "sem destinatario"}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em]">
                          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-slate-300">
                            {item.type}
                          </span>
                          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-slate-300">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Criado em {new Date(item.createdAt).toLocaleString("pt-BR")}
                          {item.sentAt ? ` • Enviado em ${new Date(item.sentAt).toLocaleString("pt-BR")}` : ""}
                        </p>
                        {item.payload && typeof item.payload.deliveryError === "string" ? (
                          <p className="text-sm text-rose-300">{item.payload.deliveryError}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                          disabled={retryMutation.isPending}
                          onClick={() => retryMutation.mutate(item.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reenviar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Preview e disparo de template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Destinatario</p>
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
                  >
                    <option value="" className="bg-slate-950 text-white">
                      Selecione um usuario
                    </option>
                    {recipientsQuery.data?.map((user) => (
                      <option key={user.id} value={String(user.id)} className="bg-slate-950 text-white">
                        {user.name} • {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Payload extra em JSON</p>
                  <Textarea
                    value={payloadJson}
                    onChange={(event) => setPayloadJson(event.target.value)}
                    className="min-h-24 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-transparent text-white hover:bg-white/5"
                    disabled={!selectedUserId || previewMutation.isPending}
                    onClick={() => previewMutation.mutate()}
                  >
                    <Eye className="h-4 w-4" />
                    {previewMutation.isPending ? "Gerando..." : "Gerar preview"}
                  </Button>
                  <Button
                    className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                    disabled={!selectedUserId || sendTemplateMutation.isPending}
                    onClick={() => sendTemplateMutation.mutate()}
                  >
                    <Send className="h-4 w-4" />
                    {sendTemplateMutation.isPending ? "Enviando..." : "Disparar template"}
                  </Button>
                </div>

                {preview ? (
                  <div className="space-y-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <p className="font-medium text-white">{preview.subject}</p>
                      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-300">
                        {preview.text}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">Preview visual</p>
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                        <iframe
                          title="Preview do e-mail"
                          srcDoc={preview.html}
                          className="h-[540px] w-full bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-emerald-100/10 bg-slate-950/70 shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
              <CardHeader>
                <CardTitle className="text-white">Criar e-mail livre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">E-mail do destinatario</p>
                  <Input
                    value={customRecipient}
                    onChange={(event) => setCustomRecipient(event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Assunto</p>
                  <Input
                    value={customSubject}
                    onChange={(event) => setCustomSubject(event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Texto</p>
                  <Textarea
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    className="min-h-32 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">HTML opcional</p>
                  <Textarea
                    value={customHtml}
                    onChange={(event) => setCustomHtml(event.target.value)}
                    className="min-h-28 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  disabled={!customRecipient || !customSubject || !customText || customEmailMutation.isPending}
                  onClick={() => customEmailMutation.mutate()}
                >
                  <Mail className="h-4 w-4" />
                  {customEmailMutation.isPending ? "Enviando e-mail..." : "Enviar e-mail livre"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
