import fs from 'fs';
import { Client } from 'pg';

async function run() {
  console.log('Lendo chaves do Supabase...');
  let url = '';
  try {
    const data = JSON.parse(fs.readFileSync('./artifacts/api-server/src/lib/integration-secrets.json', 'utf8'));
    url = data?.supabase?.DATABASE_URL;
  } catch(e) {
    console.error('Falha ao ler o json: ', e.message);
  }
  
  if (!url) {
    console.error('DATABASE_URL nao configurado no arquivo de integracoes!');
    process.exit(1);
  }

  console.log('Conectando ao banco (Supabase)...');
  const client = new Client({ connectionString: url });
  await client.connect();
  
  console.log('Executando TRUNCATE CASCADE para varrer Households, Users e dados agregados...');
  await client.query('TRUNCATE households, users RESTART IDENTITY CASCADE;');
  
  console.log('SUCESSO! O banco foi zerado e está pronto para criar o Admin na proxima inicialização!');
  await client.end();
}

run().catch(err => {
  console.error('ERRO AO ZERAR:', err);
  process.exit(1);
});
