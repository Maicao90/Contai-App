import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Image, MessageSquareText, Mic } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type CostsResponse = {
  openAiToday: number;
  geminiToday: number;
  totalToday: number;
  byUser: Array<{ userId: number; name: string; estimatedCost: number }>;
  byHousehold: Array<{ householdId: number; householdName: string; estimatedCost: number }>;
  byProcessingType: { text: number; audio: number; image: number };
  averages: { costPerUser: number; costPerHousehold: number };
  series: Array<{ day: string; total: number; openai: number; gemini: number }>;
};

export default function AdminCostsPage() {
  const [period, setPeriod] = useState("today");

  const { data } = useQuery({
    queryKey: ["admin-costs", period],
    queryFn: () => getJson<CostsResponse>("/admin/costs"),
  });

  const max = Math.max(...(data?.series.map((item) => item.total) ?? [1]), 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin · Custos e uso"
          title="Custos operacionais da IA"
          description="Acompanhe custo por provedor, usuario, household e tipo de entrada para manter o SaaS saudavel."
          badge="Plano Contai"
        />

        <div className="flex justify-stretch sm:justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white sm:max-w-xs">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="custom">Periodo customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="OpenAI hoje" value={formatCurrency(data?.openAiToday ?? 0)} helper="Interpretacao e respostas" icon={CircleDollarSign} tone="slate" />
          <MetricCard title="Gemini hoje" value={formatCurrency(data?.geminiToday ?? 0)} helper="Audio e imagem" icon={CircleDollarSign} tone="slate" />
          <MetricCard title="Custo total" value={formatCurrency(data?.totalToday ?? 0)} helper="Estimativa do dia" icon={CircleDollarSign} tone="slate" />
          <MetricCard title="Custo medio por usuario" value={formatCurrency(data?.averages.costPerUser ?? 0)} helper="Media operacional" icon={CircleDollarSign} tone="slate" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Custo por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="-mx-1 overflow-x-auto px-1">
                <div className="flex min-w-[320px] items-end gap-2 sm:min-w-0">
                {data?.series.map((item) => (
                  <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end rounded-2xl bg-slate-100/80 p-2">
                      <div className="w-full rounded-xl bg-slate-900" style={{ height: `${Math.max((item.total / max) * 100, item.total ? 14 : 8)}%` }} />
                    </div>
                    <p className="text-center text-[11px] text-slate-500">{item.day.slice(5).replace("-", "/")}</p>
                  </div>
                ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Uso por tipo de entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-slate-700" />
                  <p className="text-sm text-slate-500">Texto</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.byProcessingType.text ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-slate-700" />
                  <p className="text-sm text-slate-500">Audio</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.byProcessingType.audio ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-slate-700" />
                  <p className="text-sm text-slate-500">Imagem</p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.byProcessingType.image ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Usuarios mais caros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.byUser.map((item) => (
                <div key={item.userId} className="flex flex-col gap-1 rounded-2xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-slate-950">{item.name}</p>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.estimatedCost)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Households mais caros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.byHousehold.map((item) => (
                <div key={item.householdId} className="flex flex-col gap-1 rounded-2xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-slate-950">{item.householdName}</p>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(item.estimatedCost)}</p>
                </div>
              ))}
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Custo medio por household</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{formatCurrency(data?.averages.costPerHousehold ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
