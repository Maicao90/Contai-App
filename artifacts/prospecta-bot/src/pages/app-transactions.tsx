import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Trash2, Edit2, Calendar, ArrowUpRight, ArrowDownRight, ChevronRight, MoreHorizontal } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: number;
  type: string;
  amount: string;
  category: string;
  description: string;
  visibility: string;
  createdBy: string | null;
  transactionDate: string;
};

type Category = {
  id: number;
  name: string;
  type: string;
};

export default function AppTransactionsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const householdId = session?.householdId ?? 1;

  // Filtros
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Queries
  const { data: categories } = useQuery({
    queryKey: ["categories", householdId],
    queryFn: () => getJson<Category[]>(`/categories?householdId=${householdId}`),
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", householdId, filterType, filterCategory, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (search) params.set("search", search);
      return getJson<Transaction[]>(`/transactions?${params.toString()}`);
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<Transaction>) => postJson("/transactions", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Transaction>) => patchJson(`/transactions/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJson(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  function formatTransactionDate(value: string) {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            eyebrow="Transações"
            title="Histórico de movimentações"
            description="Tudo o que você e sua conta geraram via WhatsApp ou aqui pelo painel."
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <TransactionForm 
                onSubmit={(data) => createMutation.mutate(data)}
                categories={categories ?? []}
                isLoading={createMutation.isPending}
                title="Adicionar Transação"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Descrição do gasto..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
              
              <div className="w-full space-y-2 md:w-48">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="expense">📉 Despesa</SelectItem>
                    <SelectItem value="income">📈 Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full space-y-2 md:w-56">
                <Label>Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Todas categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
                  setFilterCategory("all");
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            ))
          ) : transactions?.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed border-slate-200 bg-transparent">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                <Search className="h-8 w-8" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">Nenhuma transação encontrada</p>
              <p className="mt-1 text-sm text-slate-500">Tente ajustar seus filtros ou adicione uma nova.</p>
            </Card>
          ) : (
            transactions?.map((item) => (
              <div 
                key={item.id} 
                className="group relative flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 transition hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-sm sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                    {item.type === 'income' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{item.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatTransactionDate(item.transactionDate)}
                      </span>
                      <span>•</span>
                      <span>{item.createdBy || "Robô"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-base font-bold ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(Number(item.amount)))}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px] font-medium leading-none tracking-tight uppercase border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      {item.visibility === 'shared' ? 'Compartilhado' : 'Pessoal'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => setEditingTransaction(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O valor de {formatCurrency(Number(item.amount))} será removido dos seus relatórios.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-rose-600 hover:bg-rose-700 rounded-2xl"
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            Excluir agora
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Edição */}
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="sm:max-w-[425px]">
            {editingTransaction && (
              <TransactionForm 
                initialData={editingTransaction}
                categories={categories ?? []}
                onSubmit={(data) => updateMutation.mutate({...data, id: editingTransaction.id})}
                isLoading={updateMutation.isPending}
                title="Editar Transação"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function TransactionForm({ 
  initialData, 
  categories, 
  onSubmit, 
  isLoading,
  title
}: { 
  initialData?: Transaction; 
  categories: Category[]; 
  onSubmit: (data: any) => void;
  isLoading: boolean;
  title: string;
}) {
  const [formData, setFormData] = useState({
    type: initialData?.type ?? "expense",
    amount: initialData?.amount ?? "",
    category: initialData?.category ?? (categories[0]?.name || "Outros"),
    description: initialData?.description ?? "",
    transactionDate: initialData?.transactionDate ? initialData.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
    visibility: initialData?.visibility ?? "shared",
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 py-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Preencha os detalhes da movimentação financeira.</DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
              <SelectTrigger className="rounded-2xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">📉 Despesa</SelectItem>
                <SelectItem value="income">📈 Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="rounded-2xl border-slate-200"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="rounded-2xl border-slate-200"
            placeholder="Ex: Padaria, Salário, Internet"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
              <SelectTrigger className="rounded-2xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                {!categories.some(c => c.name === formData.category) && <SelectItem value={formData.category}>{formData.category}</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input 
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({...formData, transactionDate: e.target.value})}
              className="rounded-2xl border-slate-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Visibilidade</Label>
          <Select value={formData.visibility} onValueChange={(val) => setFormData({...formData, visibility: val})}>
            <SelectTrigger className="rounded-2xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">Compartilhado com a conta</SelectItem>
              <SelectItem value="personal">Apenas meu registro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="mt-6 flex-row gap-2">
        <Button 
          type="submit" 
          className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700"
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </DialogFooter>
    </form>
  );
}
