import {
  CalendarDays,
  ChartColumnBig,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Link2,
  Medal,
  ReceiptText,
  Settings,
  Users,
  Wallet,
  Target,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ShellLayout } from "@/components/shell-layout";

const appNavItems = [
  { name: "Visão Geral", href: "/app/dashboard", icon: LayoutDashboard },
  { name: "Transações", href: "/app/transacoes", icon: Wallet },
  { name: "Contas", href: "/app/contas", icon: ReceiptText },
  { name: "Agenda", href: "/app/agenda", icon: CalendarDays },
  { name: "Relatórios", href: "/app/relatorios", icon: ChartColumnBig },
  { name: "Categorias", href: "/app/categorias", icon: FolderTree },
  { name: "Metas", href: "/app/metas", icon: Target },
  { name: "Membros", href: "/app/membros", icon: Users },
  { name: "Integrações", href: "/app/integracoes", icon: Link2 },
  { name: "Indicações", href: "/app/indicacoes", icon: Medal },
  { name: "Assinatura", href: "/app/assinatura", icon: CreditCard },
  { name: "Configurações", href: "/app/configuracoes", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { session } = useAuth();
  
  const isPublicAssinatura = location === "/assinatura" || location.startsWith("/assinatura?");
  const hasAccount = session !== null;
  const activeNavItems = (hasAccount && !isPublicAssinatura) ? appNavItems : [];

  return (
    <ShellLayout
      area="app"
      title={isPublicAssinatura || !hasAccount ? "Acesso restrito" : "Painel do usuário"}
      subtitle={isPublicAssinatura ? "Conclua sua escolha de pagamento para liberar o sistema." : "Acompanhe seu dinheiro, sua rotina e sua conta compartilhada."}
      navItems={activeNavItems}
    >
      {children}
    </ShellLayout>
  );
}
