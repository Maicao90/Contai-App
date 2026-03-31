"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HandWrittenTitleProps {
  title?: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  strokeClassName?: string;
  compact?: boolean;
}

function HandWrittenTitle({
  title = "Hand Written",
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  strokeClassName,
  compact = false,
}: HandWrittenTitleProps) {
  const viewBox = compact ? "0 0 1200 260" : "0 0 1200 600";
  const pathDefinition = compact
    ? `M 210 145
       C 300 92, 525 76, 720 84
       C 900 92, 1015 122, 1010 162
       C 1004 210, 855 232, 620 232
       C 392 232, 238 214, 214 180
       C 198 160, 196 150, 210 145`
    : `M 950 90
       C 1250 300, 1050 480, 600 520
       C 250 520, 150 480, 150 300
       C 150 120, 350 80, 600 80
       C 850 80, 950 180, 950 180`;
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
            transition: {
                pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] as const },
                opacity: { duration: 0.5 },
            },
        },
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-4xl",
        compact ? "h-[104px] py-0 sm:h-[128px]" : "py-24",
        className,
      )}
    >
      <div className="absolute inset-0">
        <motion.svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="h-full w-full"
        >
          <title>KokonutUI</title>
          <motion.path
            d={pathDefinition}
            fill="none"
            strokeWidth={compact ? "9" : "12"}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className={cn("text-black opacity-90 dark:text-white", strokeClassName)}
          />
        </motion.svg>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.h1
          className={cn(
            "flex items-center gap-2 text-4xl tracking-tighter text-black dark:text-white md:text-6xl",
            compact && "min-h-[104px] sm:min-h-[128px]",
            titleClassName,
          )}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {title}
        </motion.h1>
        {subtitle ? (
          <motion.p
            className={cn("text-xl text-black/80 dark:text-white/80", subtitleClassName)}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}

export { HandWrittenTitle };
