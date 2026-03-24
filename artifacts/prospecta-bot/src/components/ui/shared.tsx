import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "danger" | "glass", size?: "default" | "sm" | "lg" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30": variant === "default",
          "border-2 border-border hover:border-primary/50 hover:bg-primary/10 text-foreground": variant === "outline",
          "hover:bg-white/5 text-muted-foreground hover:text-foreground": variant === "ghost",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20": variant === "danger",
          "glass text-foreground hover:bg-white/10": variant === "glass",
          "h-10 px-4 py-2": size === "default",
          "h-8 px-3 text-sm rounded-lg": size === "sm",
          "h-12 px-6 text-lg rounded-2xl": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-xl border-2 border-input bg-background/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border-2 border-input bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-y",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-12 w-full appearance-none rounded-xl border-2 border-input bg-background/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("bg-card border border-card-border rounded-2xl shadow-xl shadow-black/20", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger" | "info" | "outline", className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      {
        "bg-slate-500/10 text-slate-300 border-slate-500/20": variant === "default",
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20": variant === "success",
        "bg-amber-500/10 text-amber-400 border-amber-500/20": variant === "warning",
        "bg-rose-500/10 text-rose-400 border-rose-500/20": variant === "danger",
        "bg-sky-500/10 text-sky-400 border-sky-500/20": variant === "info",
        "bg-transparent text-muted-foreground border-border": variant === "outline",
      },
      className
    )}>
      {children}
    </span>
  );
}
