import React, { type ElementType, type HTMLAttributes, useEffect, useRef, useState } from "react";

type Ripple = {
  id: number;
  x: number;
  y: number;
};

const digitalSerenityStyles = `
  #mouse-gradient-react {
    position: fixed;
    pointer-events: none;
    border-radius: 9999px;
    background-image: radial-gradient(circle, rgba(156, 163, 175, 0.05), rgba(107, 114, 128, 0.05), transparent 70%);
    transform: translate(-50%, -50%);
    will-change: left, top, opacity;
    transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
  }
  @keyframes word-appear {
    0% { opacity: 0; transform: translateY(30px) scale(0.8); }
    50% { opacity: 0.8; transform: translateY(10px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes grid-draw {
    0% { stroke-dashoffset: 1000; opacity: 0; }
    50% { opacity: 0.3; }
    100% { stroke-dashoffset: 0; opacity: 0.15; }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.1); }
  }
  @keyframes underline-grow {
    to { width: 100%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
    25% { transform: translateY(-10px) translateX(5px); opacity: 0.6; }
    50% { transform: translateY(-5px) translateX(-3px); opacity: 0.4; }
    75% { transform: translateY(-15px) translateX(7px); opacity: 0.8; }
  }
  .word-animate {
    display: inline-block;
    opacity: 0;
    transition: color 0.3s ease, transform 0.3s ease, text-shadow 0.3s ease;
  }
  .word-animate:hover {
    color: #f8fafc;
    transform: translateY(-2px);
    text-shadow: 0 0 20px rgba(203, 213, 225, 0.18);
  }
  .grid-line {
    stroke: #94a3b8;
    stroke-width: 0.5;
    opacity: 0;
    stroke-dasharray: 5 5;
    stroke-dashoffset: 1000;
    animation: grid-draw 2s ease-out forwards;
  }
  .detail-dot {
    fill: #cbd5e1;
    opacity: 0;
    animation: pulse-glow 3s ease-in-out infinite;
  }
  .corner-element-animate {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(203, 213, 225, 0.2);
    opacity: 0;
    animation: word-appear 1s ease-out forwards;
  }
  .text-decoration-animate {
    position: relative;
  }
  .text-decoration-animate::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
    animation: underline-grow 2s ease-out forwards;
    animation-delay: 2s;
  }
  .floating-element-animate {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #cbd5e1;
    border-radius: 50%;
    opacity: 0;
    animation: float 4s ease-in-out infinite;
    animation-play-state: paused;
  }
  .ripple-effect {
    position: fixed;
    width: 4px;
    height: 4px;
    background: rgba(203, 213, 225, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: pulse-glow 1s ease-out forwards;
    z-index: 9999;
  }
  @media (prefers-reduced-motion: reduce) {
    .word-animate,
    .corner-element-animate,
    .floating-element-animate,
    .grid-line,
    .detail-dot,
    .ripple-effect {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
`;

export function DigitalSerenityTextStyles() {
  return <style>{digitalSerenityStyles}</style>;
}

type AnimatedWordsProps<T extends ElementType> = {
  as?: T;
  text: string;
  baseDelay?: number;
  step?: number;
  className?: string;
  wordClassName?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function AnimatedWords<T extends ElementType = "span">({
  as,
  text,
  baseDelay = 0,
  step = 110,
  className,
  wordClassName,
  ...props
}: AnimatedWordsProps<T>) {
  const Component = (as ?? "span") as ElementType;
  const words = text.split(" ");

  return (
    <Component className={className} {...props}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <span
            className={`word-animate ${wordClassName ?? ""}`.trim()}
            style={{
              animation: "word-appear 0.8s ease-out forwards",
              animationDelay: `${baseDelay + index * step}ms`,
            }}
          >
            {word}
          </span>
          {index < words.length - 1 ? (
            <span aria-hidden="true" className="inline-block w-[0.18em] sm:w-[0.22em]" />
          ) : null}
        </React.Fragment>
      ))}
    </Component>
  );
}

const DigitalSerenity = () => {
  const [mouseGradientStyle, setMouseGradientStyle] = useState({
    left: "0px",
    top: "0px",
    opacity: 0,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const floatingElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseGradientStyle({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        opacity: 1,
      });
    };
    const handleMouseLeave = () => {
      setMouseGradientStyle((prev) => ({ ...prev, opacity: 0 }));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
      }, 1000);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(".floating-element-animate")) as HTMLElement[];
    floatingElementsRef.current = elements;

    const handleScroll = () => {
      if (scrolled) return;
      setScrolled(true);
      floatingElementsRef.current.forEach((element, index) => {
        window.setTimeout(() => {
          element.style.animationPlayState = "running";
          element.style.opacity = "";
        }, (parseFloat(element.style.animationDelay || "0") * 1000) + index * 100);
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <>
      <DigitalSerenityTextStyles />
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-800 font-primary text-slate-100">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="gridReactDarkResponsive" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(100, 116, 139, 0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridReactDarkResponsive)" />
          <line x1="0" y1="20%" x2="100%" y2="20%" className="grid-line" style={{ animationDelay: "0.5s" }} />
          <line x1="0" y1="80%" x2="100%" y2="80%" className="grid-line" style={{ animationDelay: "1s" }} />
          <line x1="20%" y1="0" x2="20%" y2="100%" className="grid-line" style={{ animationDelay: "1.5s" }} />
          <line x1="80%" y1="0" x2="80%" y2="100%" className="grid-line" style={{ animationDelay: "2s" }} />
          <line x1="50%" y1="0" x2="50%" y2="100%" className="grid-line" style={{ animationDelay: "2.5s", opacity: "0.05" }} />
          <line x1="0" y1="50%" x2="100%" y2="50%" className="grid-line" style={{ animationDelay: "3s", opacity: "0.05" }} />
          <circle cx="20%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3s" }} />
          <circle cx="80%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3.2s" }} />
          <circle cx="20%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.4s" }} />
          <circle cx="80%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.6s" }} />
          <circle cx="50%" cy="50%" r="1.5" className="detail-dot" style={{ animationDelay: "4s" }} />
        </svg>

        <div className="corner-element-animate left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8" style={{ animationDelay: "4s" }}>
          <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-slate-300 opacity-30" />
        </div>
        <div className="corner-element-animate right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8" style={{ animationDelay: "4.2s" }}>
          <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-slate-300 opacity-30" />
        </div>
        <div className="corner-element-animate bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8" style={{ animationDelay: "4.4s" }}>
          <div className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-slate-300 opacity-30" />
        </div>
        <div className="corner-element-animate bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8" style={{ animationDelay: "4.6s" }}>
          <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-slate-300 opacity-30" />
        </div>

        <div className="floating-element-animate" style={{ top: "25%", left: "15%", animationDelay: "0.5s" }} />
        <div className="floating-element-animate" style={{ top: "60%", left: "85%", animationDelay: "1s" }} />
        <div className="floating-element-animate" style={{ top: "40%", left: "10%", animationDelay: "1.5s" }} />
        <div className="floating-element-animate" style={{ top: "75%", left: "90%", animationDelay: "2s" }} />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-10 sm:px-8 sm:py-12 md:px-16 md:py-20">
          <div className="text-center">
            <h2 className="text-xs font-light uppercase tracking-[0.2em] text-slate-300 opacity-80 sm:text-sm">
              <AnimatedWords text="Stillness speaks." baseDelay={0} as="span" />
            </h2>
            <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-30 sm:w-16" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <h1 className="text-decoration-animate text-3xl font-extralight leading-tight tracking-tight text-slate-50 sm:text-4xl md:text-5xl lg:text-6xl">
              <div className="mb-4 md:mb-6">
                <AnimatedWords text="Find your center," baseDelay={700} />
              </div>
              <div className="text-xl font-thin leading-relaxed tracking-wide text-slate-300 sm:text-2xl md:text-3xl lg:text-4xl">
                <AnimatedWords
                  text="where peace resides and clarity awakens within the soul."
                  baseDelay={1400}
                />
              </div>
            </h1>
            <div className="absolute -left-6 top-1/2 h-px w-3 -translate-y-1/2 bg-slate-300 opacity-0 sm:-left-8 sm:w-4" style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "3.2s" }} />
            <div className="absolute -right-6 top-1/2 h-px w-3 -translate-y-1/2 bg-slate-300 opacity-0 sm:-right-8 sm:w-4" style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "3.4s" }} />
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 h-px w-12 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-30 sm:w-16" />
            <h2 className="text-xs font-light uppercase tracking-[0.2em] text-slate-300 opacity-80 sm:text-sm">
              <AnimatedWords text="Observe, accept, let go." baseDelay={3000} />
            </h2>
            <div className="mt-6 flex justify-center space-x-4 opacity-0" style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "4.2s" }}>
              <div className="h-1 w-1 rounded-full bg-slate-300 opacity-40" />
              <div className="h-1 w-1 rounded-full bg-slate-300 opacity-60" />
              <div className="h-1 w-1 rounded-full bg-slate-300 opacity-40" />
            </div>
          </div>
        </div>

        <div
          id="mouse-gradient-react"
          className="h-60 w-60 blur-xl sm:h-80 sm:w-80 sm:blur-2xl md:h-96 md:w-96 md:blur-3xl"
          style={{
            left: mouseGradientStyle.left,
            top: mouseGradientStyle.top,
            opacity: mouseGradientStyle.opacity,
          }}
        />

        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="ripple-effect"
            style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
          />
        ))}
      </div>
    </>
  );
};

export default DigitalSerenity;
