import { LeadStatus } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<LeadStatus, { label: string; className: string }> = {
    [LeadStatus.Novo]: {
      label: "Novo",
      className: "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20",
    },
    [LeadStatus.Contatado]: {
      label: "Contatado",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    },
    [LeadStatus.Convertido]: {
      label: "Convertido",
      className: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",
    },
    [LeadStatus.Perdido]: {
      label: "Perdido",
      className: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
    },
    [LeadStatus.Ignorado]: {
      label: "Ignorado",
      className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20",
    },
  };

  const config = variants[status];

  return (
    <Badge variant="outline" className={cn("font-medium transition-colors", config.className)}>
      {config.label}
    </Badge>
  );
}
