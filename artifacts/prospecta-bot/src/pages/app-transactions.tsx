import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Trash2, Edit2, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Wallet, ChevronDown, X, Plus, CalendarIcon
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  paymentMethod?: string | null;
  fiscalContext: "personal" | "business";
};

type Category = { id: number; name: string; type: string };

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const date = new Date(tx.transactionDate).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  }
  return Object.entries(groups).sort((a, b) =>
    new Date(b[1][0].transactionDate).getTime() - new Date(a[1][0].transactionDate).getTime()
  );
}

export default function AppTransactionsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const householdId = session?.householdId ?? 1;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories", householdId],
    queryFn: () => getJson<Category[]>(`/categories?householdId=${householdId}`),
  });

  const { start, end } = getMonthRange(selectedYear, selectedMonth);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", householdId, selectedYear, selectedMonth, filterType, filterCategory, filterVisibility, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("startDate", start);
      params.set("endDate", end);
      params.set("limit", "200");
      if (filterType !== "all") params.set("type", filterType);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (search) params.set("search", search);
      return getJson<Transaction[]>(`/transactions?${params.toString()}`);
    },
  });

  const filtered = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      if (filterVisibility !== "all" && tx.visibility !== filterVisibility) return false;
      return true;
    });
  }, [transactions, filterVisibility]);

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const hasActiveFilters = filterType !== "all" || filterCategory !== "all" || filterVisibility !== "all" || search;

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Transaction>) => postJson("/transactions", payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); setIsAddOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Transaction>) => patchJson(`/transactions/${payload.id}`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transactions"] }); setEditingTransaction(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJson(`/transactions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  function clearFilters() {
    setSearch(""); setFilterType("all"); setFilterCategory("all"); setFilterVisibility("all");
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            eyebrow="Transações"
            title="Histórico de movimentações"
            description="Tudo registrado via WhatsApp ou pelo painel."
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-10 gap-2 px-4 text-sm font-semibold shadow-sm">
                <Plus className="h-4 w-4" /> Nova transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <TransactionForm onSubmit={(d) => createMutation.mutate(d)} categories={categories ?? []} isLoading={createMutation.isPending} title="Adicionar Transação" />
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Barra de Filtros ── */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 py-3">
          {/* Período */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {MONTH_LABELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Tipo */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-auto rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm gap-1 pr-2">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="expense">📉 Despesas</SelectItem>
              <SelectItem value="income">📈 Receitas</SelectItem>
            </SelectContent>
          </Select>

          {/* Categoria */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-auto rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm pr-2">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Visibilidade */}
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="h-9 w-auto rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm pr-2">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              <SelectItem value="shared">🏠 Conta da Casa</SelectItem>
              <SelectItem value="personal">👤 Pessoal</SelectItem>
            </SelectContent>
          </Select>

          {/* Busca */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar transações..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 pl-8 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 rounded-lg text-slate-500 hover:text-rose-600 text-xs">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>

        {/* ── Cards de Resumo ── */}
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-3 snap-x hide-scrollbar">
          <div className="min-w-[150px] sm:min-w-0 snap-start flex-1 rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4">
            <div className="flex items-center gap-2 text-rose-500">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Despesas</span>
            </div>
            <p className="mt-2 text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-rose-400 mt-0.5">{filtered.filter(t => t.type === "expense").length} lançamentos</p>
          </div>
          <div className="min-w-[150px] sm:min-w-0 snap-start flex-1 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Receitas</span>
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-emerald-400 mt-0.5">{filtered.filter(t => t.type === "income").length} lançamentos</p>
          </div>
          <div className={`min-w-[150px] sm:min-w-0 snap-start flex-1 rounded-2xl border p-4 ${balance >= 0 ? "border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10" : "border-orange-100 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10"}`}>
            <div className={`flex items-center gap-2 ${balance >= 0 ? "text-blue-600" : "text-orange-500"}`}>
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Saldo</span>
            </div>
            <p className={`mt-2 text-xl font-bold ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>{formatCurrency(balance)}</p>
            <p className={`text-xs mt-0.5 ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}>{balance >= 0 ? "Saldo positivo" : "Saldo negativo"}</p>
          </div>
        </div>

        {/* ── Lista Agrupada por Data ── */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Search className="h-10 w-10 text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">Nenhuma transação em {MONTH_LABELS[selectedMonth]}</p>
              <p className="mt-1 text-sm text-slate-400">Tente ajustar os filtros ou registre algo pelo WhatsApp.</p>
            </div>
          ) : (
            grouped.map(([date, txs]) => (
              <div key={date}>
                {/* Cabeçalho de Data */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{date}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <span className="text-xs text-slate-400">
                    {txs.filter(t => t.type === "expense").length > 0 && (
                      <span className="text-rose-400">- {formatCurrency(txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}</span>
                    )}
                    {txs.filter(t => t.type === "income").length > 0 && (
                      <span className="text-emerald-500 ml-2">+ {formatCurrency(txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0))}</span>
                    )}
                  </span>
                </div>

                {/* Transações do Dia */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 divide-y divide-slate-50 dark:divide-slate-800/80 overflow-hidden">
                  {txs.map((item) => (
                    <div key={item.id} className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Ícone */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.type === "income" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/10 text-rose-500"}`}>
                        {item.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>

                      {/* Descrição */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{item.category}</span>
                          {item.paymentMethod && (
                            <>
                              <span className="text-slate-200 dark:text-slate-700">•</span>
                              <span className="text-xs text-slate-400 capitalize">{item.paymentMethod}</span>
                            </>
                          )}
                          {item.visibility === "shared" && (
                            <>
                              <span className="text-slate-200 dark:text-slate-700">•</span>
                              <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-medium border-blue-200 text-blue-500 dark:border-blue-500/30">Casa</Badge>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${item.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100"}`}>
                          {item.type === "income" ? "+" : "-"} {formatCurrency(Math.abs(Number(item.amount)))}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.createdBy || "WhatsApp"}</p>
                      </div>

                      {/* Ações — visíveis só no hover */}
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" onClick={() => setEditingTransaction(item)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{item.description}</strong> — {formatCurrency(Number(item.amount))}<br />
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 rounded-xl" onClick={() => deleteMutation.mutate(item.id)}>
                                Excluir agora
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Rodapé Totalizador ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-5 py-3 text-sm">
            <span className="text-slate-500">{filtered.length} transações em {MONTH_LABELS[selectedMonth]}</span>
            <div className="flex items-center gap-4">
              <span className="text-rose-500 font-semibold">Saídas {formatCurrency(totalExpenses)}</span>
              <span className="text-emerald-600 font-semibold">Entradas {formatCurrency(totalIncome)}</span>
              <span className={`font-bold ${balance >= 0 ? "text-blue-600" : "text-orange-500"}`}>Saldo {formatCurrency(balance)}</span>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="sm:max-w-[425px]">
            {editingTransaction && (
              <TransactionForm
                initialData={editingTransaction}
                categories={categories ?? []}
                onSubmit={(data) => updateMutation.mutate({ ...data, id: editingTransaction.id })}
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

function TransactionForm({ initialData, categories, onSubmit, isLoading, title }: {
  initialData?: Transaction; categories: Category[]; onSubmit: (data: any) => void; isLoading: boolean; title: string;
}) {
  const [formData, setFormData] = useState({
    type: initialData?.type ?? "expense",
    amount: initialData?.amount ?? "",
    category: initialData?.category ?? (categories[0]?.name || "Outros"),
    description: initialData?.description ?? "",
    transactionDate: initialData?.transactionDate ? initialData.transactionDate.split("T")[0] : new Date().toISOString().split("T")[0],
    visibility: initialData?.visibility ?? "shared",
    fiscalContext: initialData?.fiscalContext ?? "personal",
  });

  const set = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4 py-2">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Preencha os detalhes da movimentação.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={formData.type} onValueChange={v => set("type", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">📉 Despesa</SelectItem>
              <SelectItem value="income">📈 Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" value={formData.amount} onChange={e => set("amount", e.target.value)} className="rounded-xl" placeholder="0,00" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Input value={formData.description} onChange={e => set("description", e.target.value)} className="rounded-xl" placeholder="Ex: Padaria, Salário, Internet" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={formData.category} onValueChange={v => set("category", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={formData.transactionDate} onChange={e => set("transactionDate", e.target.value)} className="rounded-xl" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Select value={formData.visibility} onValueChange={v => set("visibility", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="shared">🏠 Conta da Casa</SelectItem>
              <SelectItem value="personal">👤 Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Contexto</Label>
          <Select value={formData.fiscalContext} onValueChange={v => set("fiscalContext", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">👤 Pessoal (PF)</SelectItem>
              <SelectItem value="business">💼 Empresarial (PJ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
