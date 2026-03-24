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
    [LeadStatus.Morno]: {
      label: "Morno",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
    },
    [LeadStatus.Quente]: {
      label: "Quente",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
    },
    [LeadStatus.Contatado]: {
      label: "Contatado",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    },
    [LeadStatus.Convertido]: {
      label: "Convertido",
      className: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",
    },
  };

  const config = variants[status];

  return (
    <Badge variant="outline" className={cn("font-medium transition-colors", config.className)}>
      {config.label}
    </Badge>
  );
}
