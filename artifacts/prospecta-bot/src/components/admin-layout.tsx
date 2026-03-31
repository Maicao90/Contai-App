import {
  Activity,
  Bot,
  CircleDollarSign,
  CreditCard,
  Gift,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquareText,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";
import { ShellLayout } from "@/components/shell-layout";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Usuários", href: "/admin/users", icon: UserRound },
  { name: "Contas", href: "/admin/households", icon: Users },
  { name: "Assinaturas", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Conversas", href: "/admin/logs", icon: Bot },
  { name: "Processamentos", href: "/admin/processings", icon: Activity },
  { name: "Integrações", href: "/admin/integrations", icon: Link2 },
  { name: "E-mails", href: "/admin/emails", icon: Mail },
  { name: "Bot", href: "/admin/bot", icon: MessageSquareText },
  { name: "Indicações", href: "/admin/referrals", icon: Gift },
  { name: "Configurações", href: "/admin/settings", icon: Settings2 },
  { name: "Custos e Uso", href: "/admin/costs", icon: CircleDollarSign },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellLayout
      area="admin"
      title="Painel administrativo"
      subtitle="Monitore usuários, assinaturas, custos e integrações do Contai."
      navItems={adminNavItems}
    >
      {children}
    </ShellLayout>
  );
}
