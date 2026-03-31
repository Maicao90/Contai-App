import { LegalPageShell } from "@/components/legal-page-shell";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      description="Esta política explica como o Contai coleta, usa, protege e armazena dados de usuários ao utilizar o site, o painel e as integrações do produto."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Quais dados coletamos</h2>
        <p>
          O Contai pode coletar nome, telefone, e-mail, registros financeiros,
          compromissos, lembretes, dados de uso do painel, histórico de conversas
          e informações enviadas pelo usuário para organizar sua rotina.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. Como usamos esses dados</h2>
        <p>
          Usamos essas informações para prestar o serviço contratado, registrar
          gastos, organizar contas e compromissos, gerar relatórios, oferecer
          integrações e melhorar a experiência do produto.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Compartilhamento</h2>
        <p>
          O Contai não vende dados pessoais. Informações podem ser processadas por
          provedores necessários ao funcionamento do serviço, como hospedagem,
          envio de e-mail, WhatsApp oficial e integrações autorizadas pelo usuário.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Segurança</h2>
        <p>
          Adotamos medidas técnicas e operacionais para reduzir riscos de acesso
          indevido, alteração ou perda de dados, sempre buscando proteger as
          informações tratadas pelo sistema.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">5. Direitos do usuário</h2>
        <p>
          O usuário pode solicitar atualização, correção ou exclusão de dados,
          conforme aplicável, usando os canais informados pelo Contai.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">6. Contato</h2>
        <p>
          Para dúvidas sobre privacidade e tratamento de dados, entre em contato
          com o Contai pelos canais oficiais de suporte do produto.
        </p>
      </section>
    </LegalPageShell>
  );
}
