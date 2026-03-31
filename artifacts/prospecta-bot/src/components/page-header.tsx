import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <section
      className={
        dark
          ? "theme-glass-card rounded-[24px] border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:p-6 lg:rounded-[28px] lg:px-7 lg:py-6"
          : "rounded-[24px] border border-white/70 bg-white/88 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-6 lg:rounded-[28px] lg:px-7 lg:py-6"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[50rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-2.5 text-balance text-[1.9rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-[2.2rem] lg:mt-3 lg:text-[2.55rem] xl:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-[64ch] text-sm leading-6 text-muted-foreground sm:text-[0.98rem] sm:leading-7">
            {description}
          </p>
        </div>
        {badge ? (
          <Badge
            className={
              dark
                ? "w-fit max-w-full self-start whitespace-normal rounded-full bg-primary/14 px-3.5 py-1.5 text-emerald-200 hover:bg-primary/14 lg:self-auto"
                : "w-fit max-w-full self-start whitespace-normal rounded-full bg-slate-950 px-3.5 py-1.5 text-white hover:bg-slate-950 lg:self-auto"
            }
          >
            {badge}
          </Badge>
        ) : null}
      </div>
    </section>
  );
}
