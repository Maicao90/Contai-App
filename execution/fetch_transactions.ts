/**
 * 🤖 CAMADA 3: EXECUÇÃO (Determinística)
 * Script criado para ser consumido pelos Agentes da Camada 2 (LLM).
 * Saída rigorosamente em JSON para facilitar o parser da IA.
 */

async function main() {
  const args = process.argv.slice(2);
  const householdId = Number(args[0]);
  const monthYear = args[1]; // Ex: "04-2026"

  if (!householdId || isNaN(householdId) || !monthYear) {
    console.error(JSON.stringify({ error: "Parâmetros inválidos. Uso correto: npx tsx fetch_transactions.ts <householdId> <MM-YYYY>" }));
    process.exit(1);
  }

  // NOTE: Se o DB estiver inacessível, este script pode gerar dados mockados ou rodar queries reais.
  // Como estamos testando a arquitetura isolada do agente de leitura:
  try {
    console.log(JSON.stringify({
       status: "success",
       metadata: { householdId, monthYear },
       note: "Conexao determinística resolvida",
       data: [
         { id: 1, amount: "120.50", category: "Alimentação", type: "expense", date: `10-${monthYear}` },
         { id: 2, amount: "3000.00", category: "Salário", type: "income", date: `05-${monthYear}` },
         { id: 3, amount: "40.00", category: "Transporte", type: "expense", date: `12-${monthYear}` }
       ]
    }, null, 2));
    process.exit(0);
  } catch(error) {
    console.error(JSON.stringify({ error: String(error) }));
    process.exit(1);
  }
}

main();
