import { LegalPageShell } from "@/components/legal-page-shell";

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Termos de Serviço"
      description="Estes termos regulam o uso do Contai, incluindo acesso ao painel, integrações, comunicações, conta individual ou compartilhada e plano contratado."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Uso do serviço</h2>
        <p>
          O Contai é um software de organização financeira e rotina. Ao usar o
          serviço, o usuário concorda em fornecer informações verdadeiras e em
          utilizar a plataforma de forma lícita.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Conta e acesso</h2>
        <p>
          Cada conta pode ser individual ou compartilhada, conforme o plano
          vigente. O usuário é responsável por proteger seu login, sua senha e
          os acessos vinculados à sua conta.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Plano contratado</h2>
        <p>
          O Contai opera com o Plano Contai, com as condições comerciais e limites
          divulgados no site. Mudanças de preço, escopo ou renovação podem ser
          comunicadas ao usuário com antecedência razoável.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Integrações e disponibilidade</h2>
        <p>
          Algumas funcionalidades dependem de serviços externos, como WhatsApp,
          provedores de e-mail e Google Agenda. O Contai pode ajustar fluxos,
          integrações e recursos para manter o serviço funcionando corretamente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Suspensão e encerramento</h2>
        <p>
          O acesso pode ser limitado ou encerrado em caso de uso indevido,
          descumprimento destes termos, fraude, inadimplência ou risco à
          operação do produto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">6. Atualizações</h2>
        <p>
          O Contai pode atualizar estes termos para refletir melhorias no serviço,
          mudanças operacionais e exigências legais. O uso continuado da plataforma
          após alterações representa concordância com a versão atualizada.
        </p>
      </section>
    </LegalPageShell>
  );
}
