import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { SimpleInfoBadge, UserStatusBadge } from "@/components/admin-user-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getJson, postJson } from "@/lib/api";

type AdminUser = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  householdId: number | null;
  householdName: string;
  householdType: string;
  membersCount: number;
  ownerName: string;
  lastActivityAt: string;
  usageCount: number;
  messagesCount: number;
  transactionsCount: number;
  commitmentsCount: number;
  planName: string;
};

type AdminHouseholdOption = {
  id: number;
  name: string;
  type: string;
  membersCount: number;
};

function relativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [householdType, setHouseholdType] = useState("all");
  const [role, setRole] = useState("all");
  const [createMode, setCreateMode] = useState<"owner" | "partner">("owner");
  const [createForm, setCreateForm] = useState({
    name: "",
    displayName: "",
    phone: "",
    email: "",
    password: "",
    householdName: "",
    householdType: "individual",
    householdId: "",
  });
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);
    if (householdType !== "all") params.set("householdType", householdType);
    if (role !== "all") params.set("role", role);
    const suffix = params.toString();
    return suffix ? `/admin/users?${suffix}` : "/admin/users";
  }, [householdType, role, search, status]);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => getJson<AdminUser[]>(query),
  });

  const { data: householdOptions } = useQuery({
    queryKey: ["admin-households-options"],
    queryFn: () => getJson<AdminHouseholdOption[]>("/admin/households"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      postJson("/admin/users", {
        ...createForm,
        role: createMode,
        householdId: createForm.householdId ? Number(createForm.householdId) : null,
      }),
    onSuccess: async () => {
      setCreateFeedback("Usuário criado com sucesso.");
      setCreateForm({
        name: "",
        displayName: "",
        phone: "",
        email: "",
        password: "",
        householdName: "",
        householdType: "individual",
        householdId: "",
      });
      await refetch();
    },
    onError: (error) => {
      setCreateFeedback(error instanceof Error ? error.message : "Não foi possível criar o usuário.");
    },
  });

  function updateCreateField(field: keyof typeof createForm, value: string) {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }

  function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateFeedback(null);
    createMutation.mutate();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Usuários"
          title="Controle operacional de usuários"
          description="Visualize status, uso e conta vinculada dos clientes do Plano Contai."
          badge="Plano Contai"
        />

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Cadastrar novo usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Tipo de acesso</Label>
                  <Select value={createMode} onValueChange={(value) => setCreateMode(value as "owner" | "partner")}>
                    <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Titular de nova conta</SelectItem>
                      <SelectItem value="partner">Segundo membro em conta existente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={createForm.name}
                    onChange={(event) => updateCreateField("name", event.target.value)}
                    placeholder="Ex.: Maria Souza"
                    className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nome exibido</Label>
                  <Input
                    value={createForm.displayName}
                    onChange={(event) => updateCreateField("displayName", event.target.value)}
                    placeholder="Ex.: Maria"
                    className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={createForm.phone}
                    onChange={(event) => updateCreateField("phone", event.target.value)}
                    placeholder="(21) 99999-9999"
                    className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={createForm.email}
                    onChange={(event) => updateCreateField("email", event.target.value)}
                    placeholder="cliente@contai.app"
                    className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha inicial</Label>
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(event) => updateCreateField("password", event.target.value)}
                    placeholder="Crie a senha inicial"
                    className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                  />
                </div>

                {createMode === "owner" ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da conta</Label>
                      <Input
                        value={createForm.householdName}
                        onChange={(event) => updateCreateField("householdName", event.target.value)}
                        placeholder="Ex.: Casa da Maria"
                        className="h-11 rounded-2xl bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo da conta</Label>
                      <Select value={createForm.householdType} onValueChange={(value) => updateCreateField("householdType", value)}>
                        <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                          <SelectValue placeholder="Tipo da conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="shared">Compartilhada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 lg:col-span-2 xl:col-span-3 2xl:col-span-2">
                    <Label>Conta existente</Label>
                    <Select value={createForm.householdId} onValueChange={(value) => updateCreateField("householdId", value)}>
                      <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {householdOptions?.map((household) => (
                          <SelectItem key={household.id} value={String(household.id)}>
                            {household.name} • {household.membersCount}/2 membros
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  O admin pode criar novas contas ou adicionar o segundo membro com acesso próprio.
                </p>
                <Button type="submit" className="rounded-2xl" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Cadastrar usuário"}
                </Button>
              </div>

              {createFeedback ? (
                <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                  {createFeedback}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Busca e filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail"
              className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900"
            />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={householdType} onValueChange={setHouseholdType}>
              <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                <SelectValue placeholder="Tipo da conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="shared">Compartilhada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-11 rounded-2xl bg-white text-[15px] dark:bg-slate-900">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="owner">Titular</SelectItem>
                <SelectItem value="partner">Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Usuários cadastrados</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {data?.length ?? 0} resultado(s) {isFetching ? "• atualizando..." : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.map((user) => (
              <div
                key={user.id}
                className="rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-base font-semibold text-slate-950 dark:text-white">{user.name}</p>
                      <SimpleInfoBadge value="Plano Contai" tone="emerald" />
                      <UserStatusBadge status={user.status} />
                      <SimpleInfoBadge value={user.role} />
                    </div>

                    <p className="break-words text-sm text-slate-500 dark:text-slate-300">
                      {user.phone}
                      {user.email ? ` • ${user.email}` : ""}
                    </p>

                    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5 dark:bg-white/5">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Conta</p>
                        <p className="mt-1 break-words font-medium text-slate-900 dark:text-white">
                          {user.householdName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          {user.householdType} • {user.membersCount} membro(s)
                        </p>
                      </div>

                      <div className="rounded-[20px] bg-slate-50 px-4 py-3.5 dark:bg-white/5">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Uso</p>
                        <p className="mt-1 font-medium text-slate-900 dark:text-white">
                          {user.usageCount} ações
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          {user.messagesCount} mensagens • {user.transactionsCount} transações
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Última atividade
                        </p>
                        <p className="mt-1 font-medium text-slate-900 dark:text-white">
                          {relativeTime(user.lastActivityAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          Titular: {user.ownerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 xl:self-start">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" className="h-11 w-full justify-start rounded-2xl">
                        <Eye className="h-4 w-4" />
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {!data?.length ? (
              <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Nenhum usuário encontrado com os filtros atuais.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


