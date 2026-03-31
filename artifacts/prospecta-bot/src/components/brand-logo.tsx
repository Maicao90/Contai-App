import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "sidebar" | "mobile" | "hero";
  className?: string;
};

const styles = {
  sidebar: {
    frame: "w-full max-w-[178px] xl:max-w-[196px]",
    image: "w-[112%] max-w-none -ml-[6%] -mt-[8%] -mb-[11%]",
  },
  mobile: {
    frame: "w-[142px]",
    image: "w-[112%] max-w-none -ml-[6%] -mt-[8%] -mb-[11%]",
  },
  hero: {
    frame: "w-full max-w-[360px]",
    image: "w-[112%] max-w-none -ml-[6%] -mt-[10%] -mb-[16%]",
  },
};

export function BrandLogo({ variant = "sidebar", className }: BrandLogoProps) {
  const style = styles[variant];
  const src = "/contai-logo-dark.png";

  return (
    <div className={cn("overflow-hidden", style.frame, className)}>
      <img
        src={src}
        alt="Contai"
        className={cn("block h-auto", style.image)}
      />
    </div>
  );
}
