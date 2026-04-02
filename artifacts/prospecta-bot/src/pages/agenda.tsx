import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJson } from "@/lib/api";

type Commitment = {
  id: number;
  title: string;
  description: string | null;
  commitmentDate: string;
};

type Reminder = {
  id: number;
  title: string;
  reminderDate: string;
  status: string;
};

export default function AgendaPage() {
  const { data: commitments } = useQuery({
    queryKey: ["commitments"],
    queryFn: () => getJson<Commitment[]>("/commitments?householdId=1&upcoming=true"),
  });

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => getJson<Reminder[]>("/reminders?householdId=1&upcoming=true"),
  });

  return (
    <Layout>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Compromissos</CardTitle>
            <CardDescription>Agenda registrada por mensagem natural.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {commitments?.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {new Date(item.commitmentDate).toLocaleString("pt-BR")}
                </p>
                {item.description ? (
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Lembretes</CardTitle>
            <CardDescription>Contas e avisos futuros do usuário.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {reminders?.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {new Date(item.reminderDate).toLocaleString("pt-BR")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-emerald-700">
                  {item.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
