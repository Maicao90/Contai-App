import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/api";
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react";


type SystemSettings = {
  planName: string;
  monthlyPlanPrice: number;
  annualPlanPrice: number;
  memberLimit: number;
  billingCycle: string;
  onboardingFlow: string;
  monthlyMessageLimit: number;
  botTone: string;
  botReplyPrompt: string;
  globalCategories: string[];
  googleCalendarEnabled: boolean;
  audioProcessingEnabled: boolean;
  imageProcessingEnabled: boolean;
};

export default function AdminSettingsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getJson<SystemSettings>("/admin/system-settings"),
  });

  const [form, setForm] = useState<SystemSettings | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: SystemSettings) => postJson("/admin/system-settings", payload),
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Configurações salvas com sucesso." });
      await refetch();
    },
    onError: () => {
      setFeedback({ type: "error", message: "Não foi possível salvar agora." });
    },
  });

  const wipeMutation = useMutation({
    mutationFn: () => postJson("/admin/system/nuke", {}),
    onSuccess: () => {
      alert("SISTEMA ZERADO COM SUCESSO! O banco de dados foi limpo e apenas seu acesso mestre foi preservado. Você será redirecionado para o login.");
      window.location.href = "/login";
    },
    onError: (error: any) => {
      alert("Erro ao realizar o Wipe: " + (error.message || "Erro desconhecido"));
    },
  });


  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Configurações"
          title="Parâmetros globais do sistema"
          description="Controle preços mensal e anual do Contai, onboarding, tom do bot, categorias globais e recursos ativos."
          badge="Plano Contai"
        />

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle>Plano e operacao</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Nome do plano</p>
              <Input value={form?.planName ?? ""} onChange={(event) => setForm((current) => current ? { ...current, planName: event.target.value } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Preço mensal</p>
              <Input value={String(form?.monthlyPlanPrice ?? 0)} onChange={(event) => setForm((current) => current ? { ...current, monthlyPlanPrice: Number(event.target.value) } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Preço anual</p>
              <Input value={String(form?.annualPlanPrice ?? 0)} onChange={(event) => setForm((current) => current ? { ...current, annualPlanPrice: Number(event.target.value) } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Máximo de membros</p>
              <Input value={String(form?.memberLimit ?? 2)} onChange={(event) => setForm((current) => current ? { ...current, memberLimit: Number(event.target.value) } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Ciclo em destaque</p>
              <Input value={form?.billingCycle ?? ""} onChange={(event) => setForm((current) => current ? { ...current, billingCycle: event.target.value } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Onboarding padrão</p>
              <Input value={form?.onboardingFlow ?? ""} onChange={(event) => setForm((current) => current ? { ...current, onboardingFlow: event.target.value } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Limite mensal</p>
              <Input value={String(form?.monthlyMessageLimit ?? 0)} onChange={(event) => setForm((current) => current ? { ...current, monthlyMessageLimit: Number(event.target.value) } : current)} className="h-11 rounded-2xl" />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-500">Tom do bot</p>
              <Textarea value={form?.botTone ?? ""} onChange={(event) => setForm((current) => current ? { ...current, botTone: event.target.value } : current)} className="min-h-28 rounded-2xl" />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-500">Prompt de resposta do bot</p>
              <Textarea
                value={form?.botReplyPrompt ?? ""}
                onChange={(event) => setForm((current) => current ? { ...current, botReplyPrompt: event.target.value } : current)}
                className="min-h-32 rounded-2xl"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-500">Categorias globais</p>
              <Textarea
                value={(form?.globalCategories ?? []).join(", ")}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          globalCategories: event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        }
                      : current,
                  )
                }
                className="min-h-24 rounded-2xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <CardHeader>
            <CardTitle>Recursos ativos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <label className="flex flex-col gap-4 rounded-[20px] border border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">Google Agenda</p>
                <p className="text-sm text-slate-500">Ativa a integração opcional no produto.</p>
              </div>
              <Switch checked={form?.googleCalendarEnabled ?? false} onCheckedChange={(checked) => setForm((current) => current ? { ...current, googleCalendarEnabled: checked } : current)} />
            </label>
            <label className="flex flex-col gap-4 rounded-[20px] border border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">Processamento de áudio</p>
                <p className="text-sm text-slate-500">Controla transcrição e fluxo multimodal.</p>
              </div>
              <Switch checked={form?.audioProcessingEnabled ?? false} onCheckedChange={(checked) => setForm((current) => current ? { ...current, audioProcessingEnabled: checked } : current)} />
            </label>
            <label className="flex flex-col gap-4 rounded-[20px] border border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">Processamento de imagem</p>
                <p className="text-sm text-slate-500">Controla leitura de recibos e comprovantes.</p>
              </div>
              <Switch checked={form?.imageProcessingEnabled ?? false} onCheckedChange={(checked) => setForm((current) => current ? { ...current, imageProcessingEnabled: checked } : current)} />
            </label>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 shadow-none dark:border-red-900/30 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle className="text-red-700 dark:text-red-400">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-red-100 bg-white p-4 dark:border-red-900/20 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Reset Total do Sistema</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Esta ação apagará todos os usuários, grupos (households), transações, logs e configurações atuais. 
                    O acesso do administrador principal será mantido, mas todos os outros dados serão removidos permanentemente.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="destructive" 
                  className="h-11 rounded-xl font-semibold shadow-sm"
                  disabled={wipeMutation.isPending}
                  onClick={() => {
                    const confirm1 = confirm("AVISO CRÍTICO: Você tem certeza que deseja APAGAR TODO O SISTEMA? Esta ação é irreversível.");
                    if (confirm1) {
                      const confirm2 = confirm("Atenção: Todos os usuários, transações e logs serão destruídos. Continuar?");
                      if (confirm2) {
                        const safety = prompt("Para confirmar a destruição total, digite NUCLEAR no campo abaixo:");
                        if (safety === "NUCLEAR") {
                          wipeMutation.mutate();
                        } else {
                          alert("Confirmação inválida. Operação cancelada.");
                        }
                      }
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {wipeMutation.isPending ? "Limpando tudo..." : "OPERAR NUKE (ZERAR TUDO)"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {feedback ? (
          <div className={`rounded-3xl border px-5 py-4 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {feedback.message}
          </div>
        ) : null}

        <div className="flex justify-stretch sm:justify-end">
          <Button className="w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto" disabled={!form || mutation.isPending} onClick={() => form && mutation.mutate(form)}>
            {mutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}


