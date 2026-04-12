import pkg from 'pg';
const { Client } = pkg;

const main = async () => {
  const client = new Client({
    connectionString: "postgresql://postgres:Adenha90%21%21%21@db.zaaopwjkwfncvowfyzyn.supabase.co:5432/postgres"
  });

  try {
    await client.connect();
    
    const users = await client.query('SELECT id, name, email, role, phone, billing_status FROM users LIMIT 10');
    console.log("SAMPLE USERS:", JSON.stringify(users.rows, null, 2));

  } catch (err) {
    console.error("DATABASE ERROR:", err);
  } finally {
    await client.end();
  }
};

main();
