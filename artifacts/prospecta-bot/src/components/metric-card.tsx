import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "emerald",
}: {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "emerald" | "slate";
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <Card
      className={
        dark
          ? "theme-glass-card h-full min-h-[198px] rounded-[24px] border shadow-[0_18px_45px_rgba(0,0,0,0.28)]"
          : "h-full min-h-[198px] rounded-[24px] border-white/70 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
      }
    >
      <CardHeader className="flex min-h-[112px] flex-row items-start justify-between gap-3 space-y-0 p-4 sm:min-h-[118px] sm:p-5">
        <div className="min-w-0 flex-1">
          <CardDescription className="text-[0.82rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </CardDescription>
          <CardTitle className="mt-2.5 break-words text-[1.7rem] leading-none tracking-tight text-card-foreground sm:text-[2rem]">
            {value}
          </CardTitle>
        </div>
        <div
          className={
            tone === "emerald"
              ? dark
                ? "rounded-2xl bg-emerald-500/14 p-3 text-emerald-300"
                : "rounded-2xl bg-emerald-50 p-3 text-emerald-600"
              : dark
                ? "rounded-2xl bg-white/6 p-3 text-slate-200"
                : "rounded-2xl bg-slate-100 p-3 text-slate-700"
          }
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        <p className="max-w-[34ch] text-sm leading-6 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
