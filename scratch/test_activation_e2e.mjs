import pkg from 'pg';
const { Client } = pkg;

const main = async () => {
    // 1. Conectar ao DB de produção (Supabase)
    const client = new Client({
        connectionString: "postgresql://postgres:Adenha90%21%21%21@db.zaaopwjkwfncvowfyzyn.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        console.log("Conectado ao Banco de Dados...");

        // 2. Criar um usuário de teste se não existir
        const email = "teste_automacao@contai.com.br";
        const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        let userId;
        if (checkUser.rows.length === 0) {
            console.log("Criando usuário de teste...");
            const res = await client.query(
                'INSERT INTO users (name, email, phone, role, billing_status, plan_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                ['Usuário Teste E2E', email, '5500999999999', 'owner', 'pending', 'annual']
            );
            userId = res.rows[0].id;
        } else {
            userId = checkUser.rows[0].id;
            console.log("Usuário de teste já existe. ID:", userId);
            // Resetar status para garantir o teste
            await client.query('UPDATE users SET billing_status = $1 WHERE id = $2', ['pending', userId]);
        }

        // 3. Simular Webhook da Cakto via POST externo para a VPS
        console.log("Disparando Webhook para a VPS (http://76.13.168.2:3000)...");
        const webhookUrl = "http://76.13.168.2:3000/api/billing/cakto/webhook";
        const payload = {
            event: "payment.approved",
            data: {
                customer: { email: email },
                subscription: { plan: { name: "Plano Anual" } },
                transaction: { status: "approved" }
            }
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Resposta do Webhook (API na VPS):", response.status);

        // 4. Aguardar 3 segundos e verificar se o plano foi ativado no banco
        console.log("Aguardando processamento...");
        await new Promise(r => setTimeout(r, 3000));

        const finalStatus = await client.query('SELECT billing_status FROM users WHERE id = $1', [userId]);
        console.log("Status Final no Banco de Dados:", finalStatus.rows[0].billing_status);

        if (finalStatus.rows[0].billing_status === 'active') {
            console.log("✅ TESTE DE ATIVAÇÃO: SUCESSO!");
        } else {
            console.log("❌ TESTE DE ATIVAÇÃO: FALHOU (Usuário continua pendente).");
        }

    } catch (err) {
        console.error("ERRO NO TESTE:", err);
    } finally {
        await client.end();
    }
};

main();
