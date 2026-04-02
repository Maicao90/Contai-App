import fs from 'node:fs';
import pg from 'pg';

const { Client } = pg;

async function run() {
  console.log('Lendo chaves...');
  let url = '';
  try {
    const data = JSON.parse(fs.readFileSync('../../artifacts/api-server/.data/integration-secrets.json', 'utf8'));
    url = data?.secrets?.DATABASE_URL;
  } catch(e) {
    console.error('Nenhum JSON fixo de integracao encontrado, tentaremos variaveis de ambiente.');
    url = process.env.DATABASE_URL;
  }
  
  if (!url) {
    console.log('Sem DATABASE_URL. Limparemos banco local sqlite? Nao suportado aqui.');
    process.exit(1);
  }

  console.log('Conectando ao banco Pincipal...');
  const client = new Client({ connectionString: url });
  await client.connect();
  
  console.log('Apagando historico de conversas (conversation_logs) e chamadas pendentes (pending_decisions)...');
  await client.query('TRUNCATE conversation_logs, pending_decisions RESTART IDENTITY CASCADE;');
  
  console.log('SUCESSO! O historico do chatbot foi completamente esvaziado para todos os usuarios!');
  await client.end();
}

run().catch(err => {
  console.error('ERRO AO ZERAR CHATS:', err);
  process.exit(1);
});
