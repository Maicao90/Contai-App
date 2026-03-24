import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 w-full md:max-w-[420px] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md",
              t.variant === "destructive" 
                ? "bg-destructive/10 border-destructive/20 text-red-200" 
                : t.variant === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                : "bg-card/90 border-border text-foreground"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.variant === "destructive" ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : t.variant === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              {t.title && <h4 className="font-semibold text-sm">{t.title}</h4>}
              {t.description && <p className="text-sm opacity-90 mt-1">{t.description}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
