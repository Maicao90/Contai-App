import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  {
    title: "Webhook WhatsApp",
    description: "GET/POST /api/whatsapp/webhook",
    body: "Recebe texto, áudio e imagem. Texto entra direto; áudio e imagem passam primeiro pelo pipeline multimodal.",
  },
  {
    title: "Interpretação híbrida",
    description: "Regras antes da IA",
    body: "Frases simples como 'gastei 50 no mercado' são resolvidas localmente. Só cai para IA quando faltar contexto ou vier conteúdo multimodal.",
  },
  {
    title: "Módulos do MVP",
    description: "Financeiro, agenda, lembretes e cobrança",
    body: "A base já está separada em rotas e entidades próprias para crescer para plano família, relatórios automáticos e admin.",
  },
];

export default function SettingsPage() {
  return (
    <Layout>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.title} className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
