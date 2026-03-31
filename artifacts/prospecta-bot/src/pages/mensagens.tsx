import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, Badge, Button } from "@/components/ui/shared";
import { MessageModal } from "@/components/message-modal";
import { useListLeads } from "@workspace/api-client-react";
import { Lead } from "@workspace/api-client-react";
import { MessageCircle, Phone, Flame, ThermometerSun, Snowflake, CheckCircle2, Clock, Users } from "lucide-react";

export default function Mensagens() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: contatados, isLoading: loadingContatados } = useListLeads({ status: "Contatado" });
  const { data: convertidos, isLoading: loadingConvertidos } = useListLeads({ status: "Convertido" });
  const { data: novos } = useListLeads({ status: "Novo" });

  const statsCards = [
    {
      label: "Aguardando Abordagem",
      value: novos?.length ?? 0,
      icon: Clock,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
    },
    {
      label: "Contatados",
      value: contatados?.length ?? 0,
      icon: MessageCircle,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Convertidos",
      value: convertidos?.length ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
  ];

  function TemperaturaBadge({ t }: { t: string }) {
    if (t === "Quente") return (
      <Badge variant="danger" className="gap-1 px-2 py-0.5 text-xs">
        <Flame className="w-3 h-3" /> Quente
      </Badge>
    );
    if (t === "Morno") return (
      <Badge variant="warning" className="gap-1 px-2 py-0.5 text-xs">
        <ThermometerSun className="w-3 h-3" /> Morno
      </Badge>
    );
    return (
      <Badge variant="info" className="gap-1 px-2 py-0.5 text-xs">
        <Snowflake className="w-3 h-3" /> Frio
      </Badge>
    );
  }

  function LeadRow({ lead }: { lead: Lead }) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate group-hover:text-primary transition-colors">
              {lead.nomeEmpresa}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{lead.cidade}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <Badge variant="outline" className="text-[10px] py-0">{lead.nicho}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <TemperaturaBadge t={lead.temperatura} />
          {lead.telefone && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {lead.telefone}
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 group-hover:border-primary/50 group-hover:bg-primary/10"
            onClick={() => setSelectedLead(lead)}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Mensagem
          </Button>
        </div>
      </div>
    );
  }

  function Section({
    title,
    icon: Icon,
    color,
    leads,
    loading,
    emptyText,
  }: {
    title: string;
    icon: any;
    color: string;
    leads: Lead[] | undefined;
    loading: boolean;
    emptyText: string;
  }) {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h2 className="font-semibold text-white">{title}</h2>
          {leads && (
            <span className="ml-auto text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
              {leads.length}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-background/40 rounded-xl animate-pulse border border-border/50" />
            ))
          ) : leads?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
          ) : (
            leads?.map(lead => <LeadRow key={lead.id} lead={lead} />)
          )}
        </div>
      </Card>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mensagens</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas abordagens e acompanhe o pipeline de contato.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {statsCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-5 flex items-center gap-4">
              <div className={`${bg} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        <Section
          title="Contatados — Aguardando resposta"
          icon={MessageCircle}
          color="text-blue-400"
          leads={contatados}
          loading={loadingContatados}
          emptyText="Nenhum lead foi contatado ainda. Vá para Leads e envie uma mensagem!"
        />

        <Section
          title="Convertidos"
          icon={CheckCircle2}
          color="text-emerald-400"
          leads={convertidos}
          loading={loadingConvertidos}
          emptyText="Nenhuma conversão ainda. Continue prospectando!"
        />
      </div>

      <MessageModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </Layout>
  );
}
