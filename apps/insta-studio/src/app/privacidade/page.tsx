import React from "react";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-6">
      <div className="max-w-3xl bg-white p-8 rounded-xl shadow text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
        <p className="mb-4">Última atualização: 08 de Abril de 2026</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Coleta e Uso de Dados</h2>
        <p className="mb-4">
          O Contai é um assistente financeiro inteligente. Para fornecermos nosso serviço, solicitamos acesso à sua conta de forma transparente. Nós coletamos apenas as informações enviadas por você durante o cadastro e uso do aplicativo.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Uso do Google API (OAuth)</h2>
        <p className="mb-4">
          O nosso aplicativo solicita acesso à sua conta Google primariamente para integração com o <strong>Google Calendar (Agenda)</strong>. 
          As informações oriundas da nossa integração com as APIs do Google não serão transferidas, vendidas ou utilizadas para segmentação de publicidade de forma alguma.
        </p>
        
        <p className="mb-4 text-blue-700 bg-blue-50 p-4 rounded-md">
          <em>Nota de Conformidade:</em> O uso de informações recebidas e a transferência para qualquer outro aplicativo das APIs do Google aderem estritamente à <strong><a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" className="underline">Política de Dados do Usuário dos Serviços de API do Google</a></strong> (Google API Services User Data Policy), incluindo os requisitos completos de Uso Limitado.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Como protegemos suas informações</h2>
        <p className="mb-4">
          Seguimos rigorosos protocolos técnicos e organizacionais para resguardar as chaves de acesso. Utilizamos criptografia no armazenamento das chaves fornecidas pelo Google e conexões seguras sob o protocolo HTTPS.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Retenção e Exclusão</h2>
        <p className="mb-4">
          Você pode, a qualquer momento, desvincular a sua agenda ou deletar permanentemente a sua conta pelo painel administrativo do Contai. Isto causará a destruição imediata dos tokens de acesso salvos na plataforma.
        </p>
      </div>
    </div>
  );
}
