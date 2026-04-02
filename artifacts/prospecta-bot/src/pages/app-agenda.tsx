import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { getJson } from "@/lib/api";

type Commitment = {
  id: number;
  title: string;
  commitmentDate: string;
  visibility: string;
  googleCalendarEventId: string | null;
};

type Reminder = {
  id: number;
  title: string;
  reminderDate: string;
  status: string;
  googleCalendarEventId: string | null;
};

export default function AppAgendaPage() {
  const { session } = useAuth();
  const householdId = session?.householdId ?? 1;
  const commitments = useQuery({
    queryKey: ["commitments", householdId],
    queryFn: () => getJson<Commitment[]>(`/commitments?householdId=${householdId}&upcoming=true`),
  });
  const reminders = useQuery({
    queryKey: ["reminders", householdId],
    queryFn: () => getJson<Reminder[]>(`/reminders?householdId=${householdId}&upcoming=true`),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Agenda"
          title="Compromissos, tarefas e lembretes"
          description="Veja o que está no Contai e o que já foi levado para o Google Agenda no seu acesso."
        />

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Próximos compromissos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {commitments.data?.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        {item.googleCalendarEventId ? (
                          <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                            No Google Agenda
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(item.commitmentDate).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge className="w-fit bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      {item.visibility}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Lembretes ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {reminders.data?.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    {item.googleCalendarEventId ? (
                      <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">
                        No Google Agenda
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(item.reminderDate).toLocaleString("pt-BR")} · {item.status}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
