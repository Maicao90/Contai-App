import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift, Medal, Users } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson } from "@/lib/api";

type ReferralMeResponse = {
  campaign: {
    id: number;
    name: string;
    description: string | null;
    prizeTitle: string;
    startsAt: string;
    endsAt: string | null;
    activePoints: number;
    paidPoints: number;
  } | null;
  referralCode: string;
  referralLink: string;
  myPosition: number | null;
  totals: {
    points: number;
    activeCount: number;
    paidCount: number;
    invitedCount: number;
  };
  referrals: Array<{
    id: number;
    status: string;
    referredName: string;
    activePointsAwarded: number;
    paidPointsAwarded: number;
    createdAt: string;
    activatedAt: string | null;
    paidAt: string | null;
  }>;
  leaderboard: Array<{
    position: number;
    userId: number;
    name: string;
    points: number;
    activeCount: number;
    paidCount: number;
  }>;
};

function translateReferralStatus(status: string) {
  switch (status) {
    case "entered":
      return "Entrou";
    case "active":
      return "Ativo";
    case "paid":
      return "Pagou";
    case "disqualified":
      return "Desclassificado";
    default:
      return status;
  }
}

export default function AppReferralsPage() {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["app-referrals"],
    queryFn: () => getJson<ReferralMeResponse>("/referrals/me"),
  });

  async function copyLink() {
    if (!data?.referralLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopyFeedback("Link copiado.");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch {
      setCopyFeedback("Não foi possível copiar agora.");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Indicações"
          title="Traga clientes reais e suba no ranking"
          description="Cadastro não vale ponto. Uso real e pagamento confirmado é o que faz sua posição crescer."
          badge={data?.campaign?.prizeTitle ? `Prêmio: ${data.campaign.prizeTitle}` : "Campanha ativa"}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-300">Pontos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.points ?? 0}</p>
              </div>
              <Medal className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-300">Ativos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.activeCount ?? 0}</p>
              </div>
              <Users className="h-8 w-8 text-sky-500" />
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-300">Pagantes</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{data?.totals.paidCount ?? 0}</p>
              </div>
              <Gift className="h-8 w-8 text-amber-500" />
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-300">Posição</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">#{data?.myPosition ?? "-"}</p>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Ranking</Badge>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Seu link de indicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Código</p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{data?.referralCode ?? "—"}</p>
                <p className="mt-3 break-all text-sm text-slate-500 dark:text-slate-300">{data?.referralLink ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  Copiar link
                </Button>
                {copyFeedback ? <p className="self-center text-sm text-emerald-300">{copyFeedback}</p> : null}
              </div>
              <div className="rounded-3xl border border-slate-100 px-5 py-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <p>Regras da campanha:</p>
                <p className="mt-2">Cadastro não conta ponto. Usuário ativo vale {data?.campaign?.activePoints ?? 1} ponto e pagante vale {data?.campaign?.paidPoints ?? 3} pontos.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle>Top 10 da campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {data?.leaderboard.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-3xl border border-slate-100 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">#{entry.position} {entry.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {entry.activeCount} ativos • {entry.paidCount} pagantes
                    </p>
                  </div>
                  <Badge className="bg-slate-950 text-white hover:bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-600">
                    {entry.points} pts
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-white/70 bg-white/92 dark:border-white/10 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle>Suas indicações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.referrals.length ? (
              data.referrals.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{item.referredName}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        Entrou em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white text-slate-900 hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/10">
                        {translateReferralStatus(item.status)}
                      </Badge>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        {Number(item.activePointsAwarded ?? 0) + Number(item.paidPointsAwarded ?? 0)} pts
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Você ainda não trouxe ninguém. Compartilhe seu link para começar a subir no ranking.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
