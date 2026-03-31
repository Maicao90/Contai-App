"use client";

import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FeatureGridProps = {
  items: FeatureItem[];
  columnsClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  decoratorClassName?: string;
  mobileSpanLast?: boolean;
};

export function Features() {
  return null;
}

export function FeatureGrid({
  items,
  columnsClassName,
  cardClassName,
  titleClassName,
  descriptionClassName,
  decoratorClassName,
  mobileSpanLast = false,
}: FeatureGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:gap-5",
        columnsClassName,
      )}
    >
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className={cn(
              mobileSpanLast && items.length % 2 === 1 && items.length > 1 && items.length - 1 === index
                ? "col-span-2 md:col-span-1"
                : "",
              "group flex h-full flex-col rounded-[24px] border-white/10 bg-white/[0.05] shadow-none backdrop-blur-xl",
              "transition-transform duration-300 hover:-translate-y-1",
              cardClassName,
            )}
          >
            <CardHeader className="p-4 pb-2.5 text-left sm:p-7 sm:pb-3">
              <div className="flex flex-col items-start gap-3 sm:block">
                <CardDecorator className={cn("shrink-0", decoratorClassName)}>
                  <Icon className="size-5 text-emerald-300 sm:size-6" aria-hidden />
                </CardDecorator>

                <h3
                  className={cn(
                    "max-w-[15ch] text-balance text-[1rem] font-semibold leading-[1.14] tracking-[-0.03em] text-white sm:mt-6 sm:max-w-none sm:pt-0 sm:text-[1.05rem] sm:leading-8",
                    titleClassName,
                  )}
                >
                  {item.title}
                </h3>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-4 pt-0 text-left sm:px-7 sm:pb-7">
              <p className={cn("max-w-[25ch] text-pretty text-[0.84rem] leading-[1.74] text-slate-300 sm:max-w-none sm:text-[0.9rem] sm:leading-7", descriptionClassName)}>
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function CardDecorator({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative size-[58px] rounded-[18px] border border-white/10 bg-white/[0.04] sm:size-[72px] sm:rounded-[22px]",
        "flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:18px_18px] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(52,211,153,0.12),transparent_55%)]" />
      <div className="relative flex size-9 items-center justify-center rounded-xl border border-white/10 bg-[#1a222a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:size-11 sm:rounded-2xl">
        {children}
      </div>
    </div>
  );
}
