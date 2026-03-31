import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  active: "ativo",
  trial: "ativo",
  expired: "vencido",
  suspended: "suspenso",
  owner: "titular",
  partner: "parceiro",
  shared: "compartilhada",
  individual: "individual",
  connected: "conectado",
  disconnected: "desconectado",
  error: "erro",
  prepared: "preparado",
  pending: "pendente",
  processed: "processado",
  failed: "falhou",
  canceled: "cancelado",
  manual: "manual",
  text: "texto",
  audio: "audio",
  image: "imagem",
  intent: "intencao",
};

function translateLabel(value: string) {
  return labelMap[value.toLowerCase()] ?? value;
}

export function UserStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    trial: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    expired: "bg-amber-50 text-amber-700 hover:bg-amber-50",
    suspended: "bg-rose-50 text-rose-700 hover:bg-rose-50",
  };

  return (
    <Badge className={cn("capitalize", map[status] ?? "bg-slate-100 text-slate-700 hover:bg-slate-100")}>
      {translateLabel(status)}
    </Badge>
  );
}

export function SimpleInfoBadge({
  value,
  tone = "slate",
}: {
  value: string;
  tone?: "slate" | "emerald" | "rose";
}) {
  return (
    <Badge
      className={
        tone === "emerald"
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          : tone === "rose"
            ? "bg-rose-50 text-rose-700 hover:bg-rose-50"
          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
      }
    >
      {translateLabel(value)}
    </Badge>
  );
}
