import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { LayoutDashboard, Megaphone, Users, MessageSquare, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Campanhas", href: "/campanhas", icon: Megaphone },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Mensagens", href: "/leads?status=Contatado", icon: MessageSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href.split('?')[0])) return true;
    return false;
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight text-white">
          Prospecta<span className="text-primary">LP</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="block" onClick={() => setIsMobileOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
              isActive(item.href) 
                ? "text-white bg-primary/10 border border-primary/20 shadow-inner" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}>
              {isActive(item.href) && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full top-1/2 -translate-y-1/2"
                />
              )}
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive(item.href) && "text-primary")} />
              <span className="font-medium">{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="bg-card/50 border border-border rounded-xl p-4 text-sm">
          <p className="text-muted-foreground mb-2">Plano Pro</p>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden mb-1">
            <div className="bg-primary h-full w-[45%]" />
          </div>
          <p className="text-xs text-muted-foreground text-right">450 / 1000 leads</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-[#111827] border-r border-border shrink-0 z-10 relative shadow-2xl shadow-black/50">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">ProspectaLP</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 text-muted-foreground hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <motion.aside 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="relative w-72 max-w-[80%] bg-[#111827] h-full flex flex-col shadow-2xl"
          >
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
