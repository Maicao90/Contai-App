import fs from 'node:fs';
import pg from 'pg';

const { Client } = pg;

async function run() {
  console.log('Lendo chaves do Supabase...');
  let url = '';
  try {
    const data = JSON.parse(fs.readFileSync('./artifacts/api-server/.data/integration-secrets.json', 'utf8'));
    url = data?.secrets?.DATABASE_URL;
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
  // Note: we might want to keep the admin user, but the script says TRUNCATE users.
  // The setup logic in lib/db/src/index.ts (ensurePermanentAdminUser) will re-create the admin.
  await client.query('TRUNCATE households, users RESTART IDENTITY CASCADE;');
  
  console.log('SUCESSO! O banco foi zerado e está pronto para criar o Admin na proxima inicialização!');
  await client.end();
}

run().catch(err => {
  console.error('ERRO AO ZERAR:', err);
  process.exit(1);
});
