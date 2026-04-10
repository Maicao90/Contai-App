# Diretiva: Análise de Gastos Mensais

**Objetivo:** Processar o extrato de transações de um dado `householdId` e mes/ano, cruzando os dados para gerar um Dossiê Financeiro simplificado para o usuário.

**Regras de Negócio:**
1. Todo o processamento de banco de dados deve ser executado de forma determinística usando a ferramenta da Camada 3 (`execution/fetch_transactions.ts`). Você *nunca* deve fazer query no banco de dados diretamente via SQL na sua orquestração.
2. O analista (você) atua na Camada 2 (Orquestração). Chame o script, receba o Array JSON, e então aplique o seu poder analítico.
3. Se o script falhar, leia o erro, analise a saída padrão (stdout/stderr) e proponha correção ou peça novos dados ao usuário conforme descrito no `Agente.md`.

**Como Executar:**
1. Receba do usuário: `householdId` e `monthYear` (ex: "04-2026").
2. Execute o comando: `npx tsx execution/fetch_transactions.ts <householdId> <monthYear>`
3. O script irá cuspir um JSON brutão. Salve-o na memória temporária ou analise-o na hora.
4. Escreva no terminal na pasta `.tmp/` um arquivo Markdown final (ex: `.tmp/relatorio_household_1.md`) com a sua conclusão: Quais os maiores gargalos de gasto? Sobrou dinheiro?

**Tom da Resposta:**
Seja analítico e use o tom do "Guardião" do Contai. Seguro e direto.
