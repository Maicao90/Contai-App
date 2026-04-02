import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BadgePercent, Save, Target, TrendingUp, AlertCircle, CircleDashed } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getJson, patchJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type OverviewResponse = {
  household: { id: number; name: string; type: string };
  categoryBreakdown: Array<{ category: string; total: number }>;
};

type Category = {
  id: number;
  name: string;
  type: string;
  visibility: string;
  isDefault: boolean;
  monthlyLimit: string | null;
  userId: number | null;
};

export default function AppMetasPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingLimit, setEditingLimit] = useState<{ id: number; value: string } | null>(null);

  const { data: overview } = useQuery({
    queryKey: ["app-overview", session?.userId],
    queryFn: () => getJson<OverviewResponse>(`/overview?userId=${session?.userId ?? 1}`),
  });

  const householdId = overview?.household?.id;

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", householdId],
    queryFn: () => getJson<Category[]>(`/categories?householdId=${householdId}&userId=${session?.userId}`),
    enabled: !!householdId,
  });

  const { mutate: updateLimit, isPending } = useMutation({
    mutationFn: (data: { id: number; monthlyLimit: string | null; visibility: string; userId: number | null }) =>
      patchJson(`/categories/${data.id}`, { 
        monthlyLimit: data.monthlyLimit, 
        visibility: data.visibility, 
        userId: session?.userId || 0 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingLimit(null);
      toast({
        title: "Meta atualizada",
        description: "O limite de gastos da categoria foi salvo com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a meta. Tente novamente.",
      });
    },
  });

  const expenseCategories = categories?.filter((cat) => cat.type === "expense") ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Orçamento Inteligente"
          title="Central de Metas e Limites"
          description="Acompanhe seus limites de gastos. O bot do WhatsApp avisará você proativamente quando estiver perto de estourar o orçamento."
          badge="Proativo"
        />

        <section className="grid gap-6">
          <Card className="border-white/10 bg-slate-950 text-white shadow-[0_20px_60px_rgba(2,6,23,0.4)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-xl">
                <Target className="h-6 w-6 text-emerald-400" />
                Seus Limites por Categoria
              </CardTitle>
              <CardDescription className="text-slate-400">
                O bot alertará você quando os gastos atingirem 80% e 100% de cada meta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <CircleDashed className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : expenseCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="mb-4 rounded-full bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                    <Target className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-100">Nenhuma meta definida</h3>
                  <p className="mt-2 text-sm text-slate-400 max-w-sm">
                    Para definir limites de orçamento, você precisa ter categorias de despesa. Vá até a aba "Categorias" ou converse com o robô para criar novas categorias.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  {expenseCategories.map((cat) => {
                    const limit = cat.monthlyLimit ? Number(cat.monthlyLimit) : 0;
                    const spentData = overview?.categoryBreakdown.find((cb) => cb.category === cat.name);
                    const spent = spentData ? spentData.total : 0;
                    const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

                    const isEditing = editingLimit?.id === cat.id;

                    const barColor =
                      percentage >= 100
                        ? "from-red-500 to-rose-600"
                        : percentage >= 80
                        ? "from-amber-400 to-orange-500"
                        : "from-emerald-400 to-teal-500";

                    return (
                      <div
                        key={cat.id}
                        className="group relative overflow-hidden rounded-[20px] border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                              {cat.name}
                              {percentage >= 80 && percentage < 100 && (
                                <span title="Perto do limite"><AlertCircle className="h-4 w-4 text-amber-400" /></span>
                              )}
                              {percentage >= 100 && (
                                <span title="Limite excedido"><TrendingUp className="h-4 w-4 text-rose-500" /></span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {formatCurrency(spent)} de {limit > 0 ? formatCurrency(limit) : "Ilimitado"}
                            </p>
                          </div>
                          
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-24 bg-black/30 border-white/20 text-white h-9 focus-visible:ring-emerald-500"
                                value={editingLimit.value}
                                onChange={(e) => setEditingLimit({ ...editingLimit, value: e.target.value })}
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="default"
                                className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600"
                                disabled={isPending}
                                onClick={() => {
                                  updateLimit({
                                    id: cat.id,
                                    monthlyLimit: editingLimit.value ? editingLimit.value.toString() : null,
                                    visibility: cat.visibility,
                                    userId: cat.userId
                                  });
                                }}
                              >
                                <Save className="h-4 w-4 text-white" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-slate-400 hover:text-white"
                                onClick={() => setEditingLimit(null)}
                              >
                                X
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 bg-transparent text-slate-300 hover:bg-white/10 hover:text-white transition-opacity group-hover:opacity-100 sm:opacity-0"
                              onClick={() => setEditingLimit({ id: cat.id, value: cat.monthlyLimit || "" })}
                            >
                              Definir Limite
                            </Button>
                          )}
                        </div>

                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
                            style={{ width: `${limit > 0 ? percentage : 0}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs font-medium">
                          <span className={percentage >= 100 ? "text-rose-400" : percentage >= 80 ? "text-amber-400" : "text-emerald-400"}>
                            {limit > 0 ? `${percentage.toFixed(1)}% utilizado` : "Sem meta definida"}
                          </span>
                          {limit > 0 && spent < limit && (
                            <span className="text-slate-400">Restam {formatCurrency(limit - spent)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {expenseCategories.length > 0 && (
              <CardFooter className="bg-white/5 border-t border-white/5 p-6 flex flex-col md:flex-row items-center justify-between">
                 <div className="flex items-center gap-3 text-sm text-slate-400">
                    <BadgePercent className="h-5 w-5 text-emerald-400" />
                    <p>A inteligência artificial analisa seus gastos em tempo real ao mandar mensagem.</p>
                 </div>
                 <Button onClick={() => window.open('/admin/bot', '_blank')} className="mt-4 md:mt-0 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all flex items-center gap-2">
                   Testar Alerta no Bot <ArrowRight className="h-4 w-4" />
                 </Button>
              </CardFooter>
            )}
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
