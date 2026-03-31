import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MessageCircle, Power, RotateCcw, Send, UserMinus } from "lucide-react";
import { Link, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson, postJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type UserDetail = {
  profile: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    role: string;
    status: string;
  };
  household: {
    id: number | null;
    name: string;
    type: string;
    membersCount: number;
    ownerName: string;
  };
  subscription: {
    planName: string;
    amount: number;
    status: string;
    startedAt: string;
    renewalDate: string | null;
  };
  activity: {
    lastInteractionAt: string;
    totalMessages: number;
    totalTransactions: number;
    totalCommitments: number;
  };
  financial: {
    latestExpenses: Array<{ id: number; description: string; category: string; amount: number; createdAt: string }>;
    latestIncomes: Array<{ id: number; description: string; category: string; amount: number; createdAt: string }>;
  };
  agenda: {
    upcomingCommitments: Array<{ id: number; title: string; commitmentDate: string; visibility: string }>;
  };
  logs: {
    latestMessages: Array<{ id: number; content: string; intent: string; createdAt: string; sourceType: string }>;
    recentErrors: Array<{ id: number; kind: string; question: string; createdAt: string }>;
  };
};

function relativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export default function AdminUserDetailPage() {
  const [match, params] = useRoute("/admin/users/:id");
  const userId = match ? Number(params.id) : null;
  const { toast } = useToast();

  const { data, refetch } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => getJson<UserDetail>(`/admin/users/${userId}`),
    enabled: Boolean(userId),
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => postJson(`/admin/users/${userId}/actions`, { action }),
    onSuccess: (_, action) => {
      toast({
        title: "Sucesso",
        description: `Acao '${action}' executada com sucesso.`,
      });
      void refetch();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro na acao",
        description: error.message || "Nao foi possivel executar a acao agora.",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full rounded-2xl sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <PageHeader
          eyebrow="Admin · Usuário"
          title={data?.profile.name ?? "Detalhes do usuário"}
          description="Dados, assinatura, atividade, financeiro, agenda e logs do usuário em uma única tela operacional."
          badge="Plano Contai"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Mensagens" value={String(data?.activity.totalMessages ?? 0)} helper="Total enviado pelo usuário" icon={Send} tone="slate" />
          <MetricCard title="Transações" value={String(data?.activity.totalTransactions ?? 0)} helper="Criadas pelo usuário" icon={RotateCcw} tone="slate" />
          <MetricCard title="Compromissos" value={String(data?.activity.totalCommitments ?? 0)} helper="Itens de agenda criados" icon={RotateCcw} tone="slate" />
          <MetricCard title="Última interação" value={data?.activity.lastInteractionAt ? relativeTime(data.activity.lastInteractionAt) : "-"} helper="Atividade mais recente" icon={MessageCircle} tone="slate" />
        </section>

        <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Dados</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Nome</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.profile.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Telefone</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.profile.phone}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.profile.email ?? "sem e-mail"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Role</p>
                  <div className="mt-2 flex items-center gap-2">
                    <SimpleInfoBadge value={data?.profile.role ?? "-"} />
                    <UserStatusBadge status={data?.profile.status ?? "trial"} />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Household</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.household.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Tipo da conta</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.household.type} · {data?.household.membersCount ?? 0} membro(s)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Plano</p>
                  <p className="mt-1 font-semibold text-slate-950">{data?.subscription.planName}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Status</p>
                  <div className="mt-2">
                    <UserStatusBadge status={data?.subscription.status ?? "trial"} />
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Início</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.subscription.startedAt
                      ? new Date(data.subscription.startedAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">Renovação</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data?.subscription.renewalDate
                      ? new Date(data.subscription.renewalDate).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 2xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Últimos gastos</p>
                  {data?.financial.latestExpenses.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.category} · {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Últimas receitas</p>
                  {data?.financial.latestIncomes.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.category} · {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Ações administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("suspend")}
                >
                  <Power className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "suspend" ? "Aguarde..." : "Suspender usuario"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("reactivate")}
                >
                  <RotateCcw className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "reactivate" ? "Reativando..." : "Reativar usuario"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("remove_from_household")}
                >
                  <UserMinus className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "remove_from_household" ? "Removendo..." : "Remover da conta"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("reset_whatsapp_session")}
                >
                  <MessageCircle className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "reset_whatsapp_session" ? "Resetando..." : "Resetar sessao do WhatsApp"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start rounded-2xl" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("resend_onboarding")}
                >
                  <Send className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "resend_onboarding" ? "Enviando..." : "Reenviar onboarding"}
                </Button>
                <Button 
                  className="w-full justify-start rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" 
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate("mark_active")}
                >
                  <RotateCcw className="h-4 w-4" />
                  {actionMutation.isPending && actionMutation.variables === "mark_active" ? "Aguarde..." : "Marcar como ativo manualmente"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.agenda.upcomingCommitments.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(item.commitmentDate).toLocaleString("pt-BR")} · {item.visibility}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Últimas mensagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.logs.latestMessages.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SimpleInfoBadge value={item.intent} />
                      <SimpleInfoBadge value={item.sourceType} />
                    </div>
                    <p className="mt-2 text-sm text-slate-900">{item.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90">
              <CardHeader>
                <CardTitle>Erros recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.logs.recentErrors.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3">
                    <p className="font-medium text-rose-700">{item.kind}</p>
                    <p className="mt-1 text-sm text-rose-600">{item.question}</p>
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
