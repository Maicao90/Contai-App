import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Share2, UserRound } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/lib/auth";
import { getJson, patchJson, postJson } from "@/lib/api";

type Category = {
  id: number;
  userId: number | null;
  name: string;
  type: string;
  visibility: "shared" | "personal";
  isDefault: boolean;
};

type CreateCategoryPayload = {
  householdId: number;
  userId: number;
  name: string;
  type: string;
  visibility: "shared" | "personal";
};

function categoryTypeLabel(type: string) {
  if (type === "income") {
    return "Receita";
  }
  if (type === "mixed") {
    return "Mista";
  }
  return "Despesa";
}

function categoryVisibilityLabel(item: Category) {
  if (item.isDefault) {
    return "Padrão";
  }
  return item.visibility === "personal" ? "So minha" : "Compartilhada";
}

export default function AppCategoriesPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const householdId = session?.householdId ?? 1;
  const userId = session?.userId ?? 1;
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [visibility, setVisibility] = useState<"shared" | "personal">("personal");
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories", householdId, userId],
    queryFn: () => getJson<Category[]>(`/categories?householdId=${householdId}&userId=${userId}`),
  });

  const createCategory = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => postJson<Category>("/categories", payload),
    onSuccess: async () => {
      setName("");
      setType("expense");
      setVisibility("personal");
      setFeedback("Categoria criada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["categories", householdId, userId] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possivel criar a categoria.");
    },
  });

  const updateVisibility = useMutation({
    mutationFn: ({
      categoryId,
      nextVisibility,
    }: {
      categoryId: number;
      nextVisibility: "shared" | "personal";
    }) =>
      patchJson<Category>(`/categories/${categoryId}`, {
        userId,
        visibility: nextVisibility,
      }),
    onSuccess: async (_, variables) => {
      setFeedback(
        variables.nextVisibility === "shared"
          ? "Categoria disponibilizada para a conta."
          : "Categoria deixada so para você.",
      );
      await queryClient.invalidateQueries({ queryKey: ["categories", householdId, userId] });
    },
    onError: (error) => {
      setFeedback(
        error instanceof Error ? error.message : "Não foi possivel alterar a visibilidade da categoria.",
      );
    },
  });

  const grouped = useMemo(() => {
    const rows = data ?? [];
    return {
      personal: rows.filter((item) => item.visibility === "personal" && !item.isDefault),
      shared: rows.filter((item) => item.visibility === "shared" && !item.isDefault),
      defaults: rows.filter((item) => item.isDefault),
    };
  }, [data]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback("Digite um nome para a categoria.");
      return;
    }

    createCategory.mutate({
      householdId,
      userId,
      name: name.trim(),
      type,
      visibility,
    });
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categorias"
          title="Categorias da sua conta"
          description="Crie categorias compartilhadas ou categorias so suas, sem mostrar para os outros membros."
        />

        <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Nova categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nome da categoria</Label>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: Academia, Obra, Cursos"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="mixed">Mista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select
                    value={visibility}
                    onValueChange={(value) => setVisibility(value as "shared" | "personal")}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Escolha quem vai ver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">So eu vejo</SelectItem>
                      <SelectItem value="shared">Todos da conta veem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                  {visibility === "personal"
                    ? "Essa categoria vai aparecer apenas para você."
                    : "Essa categoria vai aparecer para todos os membros da conta."}
                </div>

                {feedback ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{feedback}</p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full rounded-2xl"
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? "Criando categoria..." : "Criar categoria"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
              <CardHeader>
                <CardTitle>Suas categorias</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Carregando categorias...
                  </p>
                ) : null}

                {!isLoading && data?.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Nenhuma categoria encontrada ainda.
                  </p>
                ) : null}

                {data?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200/70 bg-white/80 px-5 py-4 dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950 dark:text-white">{item.name}</p>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/10">
                        {categoryTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                      >
                        {categoryVisibilityLabel(item)}
                      </Badge>
                      {item.userId === userId && !item.isDefault ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                        >
                          Criada por você
                        </Badge>
                      ) : null}
                    </div>

                    {item.userId === userId && !item.isDefault ? (
                      <div className="mt-4 flex flex-col gap-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Disponibilidade na conta
                        </p>
                        {item.visibility === "personal" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-start rounded-2xl"
                            disabled={updateVisibility.isPending}
                            onClick={() =>
                              updateVisibility.mutate({
                                categoryId: item.id,
                                nextVisibility: "shared",
                              })
                            }
                          >
                            <Share2 className="h-4 w-4" />
                            Disponibilizar para o membro da conta
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-start rounded-2xl"
                            disabled={updateVisibility.isPending}
                            onClick={() =>
                              updateVisibility.mutate({
                                categoryId: item.id,
                                nextVisibility: "personal",
                              })
                            }
                          >
                            <UserRound className="h-4 w-4" />
                            Deixar so para mim
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-base">Padrão da conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                    {grouped.defaults.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Categorias base que todos usam.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-base">So minhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                    {grouped.personal.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Visíveis apenas para você.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-base">Compartilhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-slate-950 dark:text-white">
                    {grouped.shared.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                    Personalizadas para toda a conta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

