import { motion } from "framer-motion";
import { User } from "lucide-react";

export function FounderSection() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
            QUEM FAZ O CONTAI
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            Construído por quem viveu a operação.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-shrink-0 flex flex-col items-center"
          >
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] group hover:border-emerald-500/40 transition-all duration-500">
              <img 
                src="/maicon.jpg" 
                alt="Maicon - Fundador do Contai" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Maicon</h3>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
              Fundador & Desenvolvedor
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
            <div className="pl-6 sm:pl-8 py-2">
              <p className="text-lg sm:text-xl leading-relaxed text-slate-300 italic">
                "Eu sempre tive dificuldade de organizar a rotina financeira. Cansei de tentar usar planilhas complexas ou aplicativos que exigiam que eu mudasse meus hábitos. Quando precisei de um sistema simples e direto para as minhas finanças e da minha casa, procurei no mercado e não encontrei nada que fosse no fluxo do dia a dia. Como também sou desenvolvedor, construí. O Contai nasceu para resolver a minha vida e agora está disponível para a sua."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
