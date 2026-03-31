import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getJson, postJson, requestJson } from "@/lib/api";

type Member = {
  id: number;
  displayName: string;
  memberType: string;
  phone: string;
  email: string | null;
  role: string;
  name: string;
};

type CreateMemberResponse = {
  member: Member;
  login: {
    identifier: string;
    note: string;
  };
};

export default function AppMembersPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const householdId = session?.householdId ?? 1;
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["members", householdId],
    queryFn: () => getJson<Member[]>(`/households/${householdId}/members`),
  });

  const createMember = useMutation({
    mutationFn: () =>
      postJson<CreateMemberResponse>(`/households/${householdId}/members`, {
        ...form,
      }),
    onSuccess: async (result) => {
      setForm({
        name: "",
        displayName: "",
        phone: "",
        email: "",
        password: "",
      });
      setFeedback(
        `Membro criado com sucesso. Login: ${result.login.identifier}. Cada pessoa agora entra com a própria senha e conversa pelo próprio WhatsApp.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["members", householdId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possivel adicionar o membro.");
    },
  });

  const removeMember = useMutation({
    mutationFn: (memberId: number) =>
      requestJson<{ ok: boolean; message: string }>(`/households/${householdId}/members/${memberId}`, {
        method: "DELETE",
      }),
    onSuccess: async (result) => {
      setFeedback(result.message);
      await queryClient.invalidateQueries({ queryKey: ["members", householdId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possivel remover o membro.");
    },
  });

  const canAddMember = (data?.length ?? 0) < 2;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    createMember.mutate();
  }

  function handleRemoveMember(memberId: number, displayName: string) {
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${displayName} da conta?`);
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    removeMember.mutate(memberId);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Membros"
          title="Conta compartilhada com acessos separados"
          description="Adicione o segundo membro da conta, defina login e senha e mantenha o WhatsApp de cada pessoa separado."
        />

        <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Adicionar membro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                O Plano Contai permite ate 2 pessoas por conta. Cada uma entra com o proprio login e responde no proprio numero de WhatsApp.
              </div>

              {!canAddMember ? (
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Sua conta ja atingiu o limite de 2 membros.
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="member-name">Nome completo</Label>
                    <Input
                      id="member-name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Ex.: Milane Souza"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-display-name">Como vai aparecer na conta</Label>
                    <Input
                      id="member-display-name"
                      value={form.displayName}
                      onChange={(event) => updateField("displayName", event.target.value)}
                      placeholder="Ex.: Milane"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-phone">Telefone do WhatsApp</Label>
                    <Input
                      id="member-phone"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="(21) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-email">E-mail</Label>
                    <Input
                      id="member-email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="membro@contai.app"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-password">Senha inicial</Label>
                    <Input
                      id="member-password"
                      type="password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="Crie a senha do novo acesso"
                    />
                  </div>

                  {feedback ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{feedback}</p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full rounded-2xl"
                    disabled={createMember.isPending}
                  >
                    {createMember.isPending ? "Criando acesso..." : "Adicionar membro"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle>Membros da conta</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {data?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200/70 px-5 py-4 dark:border-white/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-slate-950 dark:text-white">{item.displayName}</p>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/10">
                        {item.memberType === "owner" ? "Titular" : "Parceiro"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">{item.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{item.phone}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {item.email ?? "sem e-mail"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                      >
                        Login proprio
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                      >
                        WhatsApp separado
                      </Badge>
                    </div>
                    {session?.role === "owner" && item.memberType !== "owner" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full rounded-2xl"
                        onClick={() => handleRemoveMember(item.id, item.displayName)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {removeMember.isPending ? "Excluindo..." : "Excluir membro"}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle>Como isso funciona</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/70 px-5 py-4 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">1. Acesso proprio</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    O novo membro entra com o proprio e-mail ou telefone e a senha criada aqui.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 px-5 py-4 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">2. WhatsApp separado</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Cada numero conversa com o bot no proprio chat e o sistema identifica quem enviou.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 px-5 py-4 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">3. Controle do titular</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    So o titular pode adicionar ou excluir membros e mexer na assinatura da conta.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
