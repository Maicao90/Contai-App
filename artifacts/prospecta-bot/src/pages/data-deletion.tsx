import { LegalPageShell } from "@/components/legal-page-shell";

export default function DataDeletionPage() {
  return (
    <LegalPageShell
      title="Exclusão de Dados do Usuário"
      description="Nesta página o usuário encontra as instruções para solicitar exclusão de dados relacionados ao uso do Contai."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">1. Como solicitar</h2>
        <p>
          Para solicitar exclusão de dados, o usuário deve entrar em contato pelos
          canais oficiais do Contai e informar os dados mínimos de identificação da
          conta, como nome, telefone e e-mail vinculado ao cadastro.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">2. O que pode ser excluído</h2>
        <p>
          A solicitação pode incluir dados cadastrais, histórico de uso, registros
          financeiros, lembretes, compromissos e demais conteúdos associados à conta,
          respeitando obrigações legais e operacionais aplicáveis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">3. Prazo de análise</h2>
        <p>
          O pedido será analisado e processado em prazo razoável, podendo exigir
          confirmação de identidade antes da exclusão definitiva.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">4. Limitações</h2>
        <p>
          Alguns dados podem ser mantidos temporariamente quando necessário para
          cumprimento de obrigações legais, prevenção a fraude, segurança ou
          defesa de direitos do Contai.
        </p>
      </section>
    </LegalPageShell>
  );
}
