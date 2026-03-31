import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift, Medal, Trophy, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getJson, postJson } from "@/lib/api";

type AdminReferralOverview = {
  campaign: {
    id: number;
    name: string;
    description: string | null;
    prizeTitle: string;
    startsAt: string;
    endsAt: string | null;
    status: string;
    activePoints: number;
    paidPoints: number;
  } | null;
  leaderboard: Array<{
    position: number;
    userId: number;
    name: string;
    email: string | null;
    points: number;
    activeCount: number;
    paidCount: number;
  }>;
  latestReferrals: Array<{
    id: number;
    status: string;
    createdAt: string;
    activatedAt: string | null;
    paidAt: string | null;
    activePointsAwarded: number;
    paidPointsAwarded: number;
    referrerName: string;
    referredName: string;
  }>;
  totals: {
    totalReferrals: number;
    totalPoints: number;
    paidReferrals: number;
    activeReferrals: number;
  };
};

export default function AdminReferralsPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: () => getJson<AdminReferralOverview>("/admin/referrals"),
  });

  const [form, setForm] = useState(() => ({
    name: data?.campaign?.name ?? "Campanha de indicação do Contai",
    description:
      data?.campaign?.description ??
      "Usuário ativo vale ponto. Usuário pagante vale ainda mais e sobe no ranking oficial.",
    prizeTitle: data?.campaign?.prizeTitle ?? "iPhone",
    activePoints: String(data?.campaign?.activePoints ?? 1),
    paidPoints: String(data?.campaign?.paidPoints ?? 3),
    startsAt: data?.campaign?.startsAt ? new Date(data.campaign.startsAt).toISOString().slice(0, 10) : "",
    endsAt: data?.campaign?.endsAt ? new Date(data.campaign.endsAt).toISOString().slice(0, 10) : "",
  }));

  useEffect(() => {
    if (!data?.campaign) {
      return;
    }

    setForm({
      name: data.campaign.name,
      description: data.campaign.description ?? "",
      prizeTitle: data.campaign.prizeTitle ?? "iPhone",
      activePoints: String(data.campaign.activePoints ?? 1),
      paidPoints: String(data.campaign.paidPoints ?? 3),
      startsAt: data.campaign.startsAt ? new Date(data.campaign.startsAt).toISOString().slice(0, 10) : "",
      endsAt: data.campaign.endsAt ? new Date(data.campaign.endsAt).toISOString().slice(0, 10) : "",
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      postJson("/admin/referrals/campaign", {
        ...form,
        activePoints: Number(form.activePoints),
        paidPoints: Number(form.paidPoints),
      }),
    onSuccess: async () => {
      setFeedback("Campanha salva.");
      await refetch();
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar a campanha.");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin • Indicações"
          title="Ranking e campanha de crescimento do Contai"
          description="Controle campanha, prêmio, pontuação e acompanhe quem está trazendo usuários ativos e pagantes."
          badge={data?.campaign?.prizeTitle ? `Prêmio: ${data.campaign.prizeTitle}` : "Campanha ativa"}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-300">Indicações</p><p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.totalReferrals ?? 0}</p></div><Users className="h-8 w-8 text-sky-500" /></CardContent></Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-300">Ativos</p><p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.activeReferrals ?? 0}</p></div><Medal className="h-8 w-8 text-emerald-500" /></CardContent></Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-300">Pagantes</p><p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.paidReferrals ?? 0}</p></div><Gift className="h-8 w-8 text-amber-500" /></CardContent></Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-300">Pontos gerados</p><p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.totalPoints ?? 0}</p></div><Trophy className="h-8 w-8 text-fuchsia-500" /></CardContent></Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Configuração da campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prêmio</Label>
                  <Input value={form.prizeTitle} onChange={(event) => setForm((current) => ({ ...current, prizeTitle: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ponto por ativo</Label>
                  <Input value={form.activePoints} onChange={(event) => setForm((current) => ({ ...current, activePoints: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ponto por pagante</Label>
                  <Input value={form.paidPoints} onChange={(event) => setForm((current) => ({ ...current, paidPoints: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="date" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Fim</Label>
                  <Input type="date" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
                </div>
              </div>
              {feedback ? <p className="text-sm text-emerald-300">{feedback}</p> : null}
              <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar campanha"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Ranking atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-3xl border border-slate-100 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">#{entry.position} {entry.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{entry.email ?? "sem e-mail"} • {entry.activeCount} ativos • {entry.paidCount} pagantes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950 dark:text-white">{entry.points} pts</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Últimas conversões por indicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.latestReferrals.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">{item.referrerName} indicou {item.referredName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">Criado em {new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <p className="text-sm font-medium text-emerald-300">
                    {Number(item.activePointsAwarded ?? 0) + Number(item.paidPointsAwarded ?? 0)} pts
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
