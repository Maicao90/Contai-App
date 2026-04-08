import { motion } from "framer-motion";
import { useState } from "react";
import { HeroDitheringBackground } from "@/components/ui/hero-dithering-card";

function OpenAIWordmark() {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center"
    >
      <div className="flex items-center gap-3 px-2 py-2 text-white sm:gap-4 sm:px-4 sm:py-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-10 w-10 fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.12)] min-[390px]:h-11 min-[390px]:w-11 sm:h-12 sm:w-12"
        >
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
        <span className="text-[2.05rem] font-semibold tracking-tight text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.08)] min-[390px]:text-[2.25rem] sm:text-4xl">
          OpenAI
        </span>
      </div>
    </motion.div>
  );
}

function MetaWordmark() {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center"
    >
      <div className="flex items-center gap-3 px-2 py-2 text-white sm:gap-4 sm:px-4 sm:py-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-10 w-[4.15rem] fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.12)] min-[390px]:h-11 min-[390px]:w-[4.5rem] sm:h-11 sm:w-20"
        >
          <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
        </svg>
        <span className="text-[2.05rem] font-semibold tracking-tight text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.08)] min-[390px]:text-[2.25rem] sm:text-4xl">
          Meta
        </span>
      </div>
    </motion.div>
  );
}

export function TechnologyAuthoritySection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,24,0.98)_0%,rgba(6,10,18,0.99)_100%)] px-4 py-10 shadow-[0_24px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:rounded-[36px] sm:px-10 sm:py-16 lg:px-16 lg:py-20"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="pointer-events-none absolute inset-0">
            <HeroDitheringBackground
              hovered={isHovered}
              colorFront="#19c37d"
              className="opacity-30 [mask-image:radial-gradient(circle_at_center,black_15%,black_58%,transparent_94%)] sm:opacity-38"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:44px_44px] opacity-14 sm:opacity-22" />
            <motion.div
              animate={{ x: ["-8%", "8%", "-8%"], opacity: [0.06, 0.14, 0.06] }}
              transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute left-[64%] top-[58%] hidden h-28 w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/12 blur-3xl sm:block sm:h-36 sm:w-[30rem]"
            />
            <motion.div
              animate={{ opacity: [0.08, 0.18, 0.08], scale: [0.94, 1.02, 0.94] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute left-[28%] top-[58%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/14 blur-3xl sm:h-36 sm:w-36"
            />
            <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/6 to-transparent sm:block" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_26%,rgba(6,10,18,0.26)_70%,rgba(6,10,18,0.82)_100%)] sm:bg-[radial-gradient(circle_at_center,transparent_26%,rgba(6,10,18,0.2)_70%,rgba(6,10,18,0.72)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,14,0.3)_0%,rgba(3,8,14,0.08)_40%,rgba(3,8,14,0.38)_100%)] sm:hidden" />
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              <h2 className="mx-auto max-w-[18rem] text-balance text-center text-[1.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white min-[390px]:max-w-[22rem] min-[390px]:text-[1.82rem] sm:max-w-[18ch] sm:text-[2.85rem] sm:leading-[1.02] lg:max-w-[20ch] lg:text-[3.05rem]">
                <span className="block">A inteligência oficial das</span>
                <span className="mt-1 sm:mt-2 block text-emerald-400">maiores empresas do mundo</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid items-center justify-center gap-6 sm:mt-12 sm:gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-12"
            >
              <OpenAIWordmark />
              <MetaWordmark />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
