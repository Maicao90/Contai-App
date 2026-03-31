import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getJson, postJson } from "@/lib/api";

type ConversationLog = {
  id: number;
  direction: string;
  content: string;
  intent: string;
  createdAt: string;
};

type SimulationResult = {
  reply: string;
  parsed: { intent: string };
  extracted?: Record<string, unknown> | null;
};

export default function ConversationsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("gastei 50 no mercado");

  const { data: logs } = useQuery({
    queryKey: ["conversation-logs"],
    queryFn: () => getJson<ConversationLog[]>("/admin/conversations?householdId=1"),
  });

  const simulate = useMutation({
    mutationFn: (content: string) =>
      postJson<SimulationResult>("/whatsapp/messages/simulate", {
        phone: "5511999990001",
        content,
        messageType: "text",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-logs"] });
    },
  });

  return (
    <Layout>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Simulador do WhatsApp</CardTitle>
            <CardDescription>
              Teste a interpretação do Contai antes de ligar no número real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value="5511999990001" disabled />
            <Textarea
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => simulate.mutate(message)}
              disabled={simulate.isPending}
            >
              Processar mensagem
            </Button>

            {simulate.data ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Intenção
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {simulate.data.parsed.intent}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Resposta
                </p>
                <p className="mt-1 text-slate-800">{simulate.data.reply}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Logs de conversa</CardTitle>
            <CardDescription>
              Histórico estruturado para análise, suporte e produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs?.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border px-4 py-3 ${
                  item.direction === "inbound"
                    ? "border-slate-100 bg-white"
                    : "border-emerald-100 bg-emerald-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {item.direction === "inbound" ? "Usuário" : "Contai"} · {item.intent}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-800">{item.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
