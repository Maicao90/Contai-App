import React from "react";

export default function Termos() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-6">
      <div className="max-w-3xl bg-white p-8 rounded-xl shadow text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Termos de Uso do Serviço</h1>
        <p className="mb-4">Última atualização: 08 de Abril de 2026</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Aceitação dos Termos</h2>
        <p className="mb-4">
          Ao acessar e usar a plataforma Contai, você concorda em cumprir integralmente este Termo de Serviço e as Políticas de Privacidade aplicáveis.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Descrição do Serviço</h2>
        <p className="mb-4">
          O Contai é projetado para atuar como um assistente inteligente. A exatidão e processamento das informações refletem as ordens fornecidas pelos usuários por meio do WhatsApp ou da interface web.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Restrições de Uso</h2>
        <p className="mb-4">
          O usuário não deve utilizar a plataforma para propósitos ilegais ou não autorizados. Reservamo-nos o direito de suspender imediatamente a conta que violar as normas de mercado, leis federais ou direitos de propriedade intelectual da plataforma.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Isenção de Garantias</h2>
        <p className="mb-4">
          O Contai processa os dados da melhor maneira com auxílio de Inteligência Artificial, mas o desenvolvedor não fornece garantias relacionadas à infalibilidade da IA da nuvem envolvida na leitura do processamento diário. A confirmação das finanças cabe ao usuário.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Jurisdição</h2>
        <p className="mb-4">
          Estes termos devem ser regidos e interpretados de acordo com a legislação vigente no Brasil.
        </p>
      </div>
    </div>
  );
}
