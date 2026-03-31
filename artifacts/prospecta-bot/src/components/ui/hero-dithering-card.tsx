import { ArrowRight } from "lucide-react";
import { Suspense, lazy, useState } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering })),
);

type HeroDitheringBackgroundProps = {
  className?: string;
  hovered?: boolean;
  colorFront?: string;
};

export function HeroDitheringBackground({
  className,
  hovered = false,
  colorFront = "#10B981",
}: HeroDitheringBackgroundProps) {
  return (
    <Suspense fallback={<div className={`absolute inset-0 bg-muted/20 ${className ?? ""}`} />}>
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-35 mix-blend-screen ${className ?? ""}`}>
        <Dithering
          colorBack="#00000000"
          colorFront={colorFront}
          shape="warp"
          type="4x4"
          speed={hovered ? 0.45 : 0.16}
          className="size-full"
          minPixelRatio={1}
        />
      </div>
    </Suspense>
  );
}

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="flex w-full items-center justify-center px-4 py-12 md:px-6">
      <div
        className="relative w-full max-w-7xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex min-h-[600px] flex-col items-center justify-center overflow-hidden rounded-[48px] border border-border bg-card shadow-sm duration-500 md:min-h-[600px]">
          <HeroDitheringBackground hovered={isHovered} colorFront="#EC4E02" />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI-Powered Writing
            </div>

            <h2 className="mb-8 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl">
              Your words, <br />
              <span className="text-foreground/80">delivered perfectly.</span>
            </h2>

            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Join 2,847 founders using the only AI that understands the nuance of your voice. Clean,
              precise, and uniquely yours.
            </p>

            <button className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-12 text-base font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:ring-4 hover:ring-primary/20 active:scale-95">
              <span className="relative z-10">Start Typing</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
