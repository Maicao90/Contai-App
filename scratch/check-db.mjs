import { Client } from 'pg';
const client = new Client({ connectionString: "postgresql://postgres:Adenha90%21%21%21@db.zaaopwjkwfncvowfyzyn.supabase.co:5432/postgres" });

async function run() {
  await client.connect();
  const result = await client.query('SELECT count(*) FROM users;');
  console.log('Total users:', result.rows[0].count);
  const result2 = await client.query('SELECT * FROM users LIMIT 3;');
  console.log('Users:', result2.rows);
  await client.end();
}
run().catch(console.error);
