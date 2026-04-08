# 📖 CONTAI - MASTER ARCHITECTURE & TECHNICAL DOSSIER (V5 UPGRADE)

> **PROPÓSITO DESTE DOCUMENTO:**  
> Este documento é o projeto arquitetural absoluto e irrestrito do SaaS **Contai**. Ele mapeia 100% da lógica de front-end, back-end, banco de dados, fluxos transacionais, integrações e algoritmos de processamento. IAs parceiras codificando este projeto DEVEM seguir estas instruções sem exceções.

---

## 1. VISÃO GERAL E TOPOLOGIA DO SISTEMA
O **Contai** é um SaaS B2C/B2B de Gestão Financeira Multitenant. A contabilidade familiar ou corporativa é registrada via WhatsApp (Texto Livre, Áudio ou Comprovantes).

* **Topologia Física:** Monorepo (`pnpm`) com separação clássica: Servidor Backend Node.js Express (`api-server`) e Frontend Web App em Vite/React (`prospecta-bot`), compartilhando pacotes internos (tipos, schemas).
* **Banco de Dados Central:** `@workspace/db` instanciado via Drizzle ORM conectando a pools do Supabase Transactional Postgres (via pooler port 6543). Localmente pode transacionar PGLite para testes dry-run.
* **Server-side (Node.js/Express):** Processamento em borda que recebe os Webhooks da Meta, trata autenticação via JWT em cookies estritos, gerencia processamentos longos e despacha lógicas pesadas.
* **Frontend Web:** Mobile-first PWA, estilizado via Tailwind CSS e ShadcnUI. Gerencia cache em memória usando React Query.

---

## 2. DICIONÁRIO DO BANCO DE DADOS (SCHEMA COMPLETO)
O Contai é desenhado em torno de "Households" e não usuários individuais isolados.

### 2.1. Organização e Tenancy
* **`usersTable`:** Representa a entidade física de acesso.
  * *Campos Chave:* `id`, `name`, `phone` (identificador oficial no app e whatsapp), `passwordHash`, `timezone` (Crucial para cálculos temporais regionais, default "America/Sao_Paulo").
* **`householdsTable`:** A entidade de escopo ("a conta bancária da família ou empresa").
  * *Tipos de Planos:* `monthly` (R$ 14,90/mês) ou `annual` (R$ 99,90/ano). 
  * *Tipos de Conglomerado:* `individual`, `couple`, `family`.
  * *Assinatura:* `billingStatus` (ex: `active`, `trial`, `past_due`, `canceled`). Todas as permissões de bot e login morrem se `past_due`.
* **`householdMembersTable`:** A relação Users x Households (`memberType`: `owner` ou `partner`).
* **`accountsTable` (V5 - Camada de Contas):** A nova fonte da verdade para saldos. Toda transação é vinculada a uma conta.
  * *Tipos:* `checking` (corrente), `credit` (cartão), `cash` (dinheiro), `savings` (poupança).
  * *Campos:* `id`, `householdId`, `name`, `type`, `balance`.
  * *Provisionamento:* Contas padrão ("Corrente", "Cartão", "Dinheiro") criadas automaticamente no primeiro acesso.

### 2.2. Entidades Financeiras Transacionais
* **`transactionsTable` (O Coração da Contabilidade):**
  * *Visibilidade:* `personal` (afeta só o autor) ou `shared` (afeta todos do Household).
  * *Tipo:* `income` (+), `expense` (-).
  * *V5 Account Binding:* Obrigatório possuir `accountId`.
  * *Transferências:* Intenção `transferencia` usa `destinationAccountId` para mover saldos entre contas internas.
  * *Pagamento:* `debito`, `credito`, `pix`, `dinheiro`, `boleto`. (Nota: Gasto em conta do tipo `credit` NÃO desconta do saldo imediato, apenas aumenta a fatura/liabilidade).
  * *Compliance (Soft-Voids)*: Exclusões NÃO fazem `.delete()`. Um registro excluído sofre UPDATE em `status` para `voided`, `canceledAt` ganha timestamp e anota-se o `reversalReason`. QUASE TODO `SELECT` da plataforma precisa filtrar `eq(transactionsTable.status, 'paid')`.
* **`billsTable` e `remindersTable`:** Armazenam eventos futuros. Se um bilhete é detectado via IA ("Pagar conta de luz dia 20"), armazena-se aqui. O Node.js possui Cronjobs nativos (Agenda Oauth) emitindo Alertas ativos.
* **`commitmentsTable`:** Agenda e rotinas marcadas.

### 2.3. O Estado Finito (`pendingDecisionsTable`) e Webhooks (`processedWebhooksTable`)
* **`processedWebhooksTable`:** Proteção Master de Idempotência. Guarda o ID oficial da mensagem da Cloud API da Meta. Evita que o mesmo pix seja duplicado no banco se a Meta re-enviar webhooks por latência de DNS.
* **`pendingDecisionsTable`:** O cérebro da engine. Segura inputs em aguardo. Ex: Se a IA pedir "Deseja confirmar esse gasto de R$ 2000?", o estado vai pra essa tabela, forçando o próximo input do usuário a não ir para o chat GPT, mas resolver a restrição do Node local. Possui colunas `kind`, `attempts`, `expiresAt` (5min) e armazena arrays em `accumulated_data` JSONB.
* **`aiLogsTable` (V5 - Observabilidade):** Auditoria de interações LLM.
  * *Campos:* `userId`, `householdId`, `modelUsed`, `tokens`, `input`, `output`, `promptVersion`.
  * *Propósito:* Controle de custos, depuração de alucinações e métricas de uso por usuário.

---

## 3. A PRIMEIRA INTERAÇÃO (FUNIL E ONBOARDING)
Como o bot recepciona o cliente pela primeira vez na rota `/api/whatsapp/webhook`:

1. *Início Rígido:* A request chega com a String "Oi" vinda de um celular desconhecido.
2. *Identity Fetch:* Transpila o `whatsapp_id`, insere "+55", padroniza nono dígitos para evitar redundância, pesquisa no PostgreSQL coringa. 
3. *Não Registrado (Gatilho Criacional Seguro):* Se não for encontrado, bloqueia-se repasse para a OpenAI (Prevenindo evasão/Prompt Injection via Whatsapp sem cadastro no DB). Dispara Hardcoded: *"Sou o Contai! Complete seu cadastro na plataforma Web em app.contai.com.br"*
4. *Inadimplentes:* Confere via Node o `household.billingStatus`. Se estiver "past_due", engessa a rede de resposta, ignorando as mensagens e exibindo link direto da Cakto Checkout para pagar.
5. *Usuário Ativo (Boas Vindas):* Retorna um prompt gerado para "Saudação e Ajuda".

---

## 4. O PIPELINE DE PROCESSAMENTO DE MENSAGENS (MÁQUINA DO TEMPO)

### 4.1. Recebendo Mídia Pesada (Voice & Image)
* Se a Meta encaminhar `type='audio'`, o `api-server` efetua download Binário da cloud do Facebook usando o Bearer Meta. Submete o buffer à Whisper v1 (`gpt-4o-mini-transcribe`) com prompts para ignorar dialetos locais confusos e devolve uma formatação contábil string pura para o motor.
* Se for `type='image'`, engatilha OpenAI Vision para scan OCR reverso (Prompt: "Extraia Data, Valor, Estabelecimento de Notas/Recibos/Boletos de forma JSON pura"), processando imediatamente na árvore analítica.

### 4.2. Regex x Probabilística (Fast-Path vs Slow-Path)
A engine opera com Otimização de Custo ($) absurda! 
* O texto flui no analisador estático Lexical: se contiver "me lembra", "quanto gastei", "cancelar tudo" - ele preenche os Enums e ignora chamadas GPT, disparando scripts internos no ato. Ex: "Quanto gastei hoje?" => Regra direta na transactionsTable somada do dia via `fnsStartOfDay`.
* Caso complexo ("Comprei 10 reais de presunto no Oxxo e paguei com cartao Nubank do meu chefe"), o sistema serializa para `interpretMessage` chamando a OpenAI. A OpenAI devolve JSON Tipado respeitando um Strict Schema via Function Calling obrigando retornar Array de transações e método/categoria.

### 4.3. Machine Learning Predictivo (Adivinhação Pessoal de Categoria)
No salvamento (`saveParsedAction`), se a intenção for "registrar gasto" e a OpenAI falhou em preencher `categoria`, acionamos a Query de ML local (`predictCategory`).
Usando `ilike(description, %word%)` filtrado pelo `householdId`, procuramos o que AQUELE usuário usou para a MESMA compra no passado. Evita generalizações. Se você sempre lança "Ifood" como "Sushi", ele aprende.

### 4.4. A Fase de Resposta Humanizada (Ghost-Writing)
A engine gera um feedback rígido `(OK transação efetuada valor 10)`. No arquivo `contai-engine.ts`, chamamos a diretriz de reescrita "Calorosa" do sistema (`rewriteReplyWithOpenAI`) baseada na "Personalidade" digitada no Admin Dashboard. O usuário recebe: *"Lançadíssimo chefe! 10 reais subtraídos da sua conta corrente 😉"*

### 4.5. Escape Commands (Middleware)
As State Machines em loop ("Qual valor? Qual valor?") podem sufocar o usuário se acionadas sem querer pelo microfone. Se ele diz ["cancelar", "voltar", "esquece"], o `escapeCommands.ts` anula instantaneamente registros órfãos persistidos na RAM (pendingDecisions), esvazia caches da API e retorna um ping positivo validando liberação do status basal (`indefinido`).

### 4.6. Confirmações de Transação em Dinheiro Vivo (High Values > 1k)
Qualquer áudio OCR ou Digitação gerando despesas >= R$ 1.000 entra em Loop High Value. Sem "Autorizar" literal, o webhook suspende o insert e trava o UUID da `session`.

---

## 5. REGRAS DO FRONTEND DASHBOARD
A interface não é genérica. O painel reside no Vite.
* **Estado e Data Fetching:** Operação primária com `useQuery` e `useMutation`. Endpoints REST seguem prefixo `/api` pelo Proxy do Vite, roteando port 5173 para 3000 localmente, ou diretamente servidos no root em Produção via Nginx.
* **Módulos Críticos do App:** 
  - `admin-dashboard.tsx`: Dados macro do plano (MRR), usuários, e "Dash de Observabilidade".
  - `transacoes.tsx`: Histórico infinito. Permite editar naturezas.
  - O Front implementa modais Radix (Dialog, Sheet) garantem interações leves. Padrões de CSS utilitário com `class-variance-authority`.

---

## 6. AS 4 GRANDES INTEGRAÇÕES EXTERNAS API
As chaves seguras habitam em `integration_secrets` geradas com fallback, encriptadas/hasheadas nos subníveis profundos. Nunca acessíveis por API publicas.
1. **Google Agenda (`google-calendar.ts`)**: Rotinas Oauth configuradas (`googleapis`). Transações categorizadas como Agendamentos engatilham eventos programáticos. 
2. **Cakto (Checkout Bilingue)**: O Webhook escuta as flags `paid` de faturas. Se processado, a interface atualiza o status de toda a família atrelada (proprietário dono + parceiros). O ciclo reativa a conta.
3. **Email em Batch Assíncronos**: Endpoint `/reports/monthly-email-batch` usado nos envios de mês a cliente, para evitar erros clássicos N+1 de request Time Out, roda a promessa interna em Async Wrapper I/O Livre sem segurar HTTP Response JSON (`res.json` devolve 200 "Iniciado"). NodeMailer cuida da fila no background.
4. **UTMify**: Eventos de aquisição (Lead ou Pix gerado) acionados na Action Server disparando S2S com Server IDs encobertos.

---

## 7. PAINÉIS DE SUPERADMIN E DANGER ZONE
Para as lendas vivas por trás da arquitetura do App gerenciado via Painel Admin de interface (App `admin-*` routes):

* **Painel de Observabilidade do Edge**: Visão instantânea da saúde da VPS e tráfego HTTPS lendo `processed_webhooks` pra interceptações recentes, medindo se há DDoS ou Gargalo da Meta batendo ociosa na porta sem sucesso. 
* **Danger Zone (Sistema Nuke Base)**: Como a LGPD prevê deleção soberana de dados, o framework `Full Wipe` tem função engatilhada nas rotas do Admin Controller `/api/admin/actions/nuclear` expurgando integralmente um Household e todos os Users alados em Cascata via FK Restrict Cascade (mas preservando os Admin Owners Master do SaaS). 

---

## 8. MANIFESTO DOS DESENVOLVEDORES IA (STRICT RULES)
Quando codificando/criando sub-funcionalidades para este Monorepo, você está proibido de quebrar essas heurísticas mecânicas:

1. **SOFT-VOID (NUNCA .DELETE() EM TABELAS TRANSAÇÕES):** Ao executar funções contábeis de estorno ou erro do WhatsApp, usar `Update -> status: "voided"`. O histórico do cliente é sacro.
2. **FILTRAGEM DE CONSULTAS "PAID":** Qualquer Dashboard somando `$amount` tem cláusula estrita `.where(eq(transactionsTable.status, 'paid'))`. Estornos afetam cálculos finais de lucro.
3. **LOCAL TIME RULES (`date-fns-tz`):** "Hoje" não existe na AWS (onde tudo é UTC). O relógio local via NodeJS invoca `fndStartOfDay(toZonedTime(new Date(), identity.user.timezone))`. Insistir em global `new Date()` quebra fuso de fechamentos.
4. **ISOLAMENTO HOUSEHOLD:** Toda inserção de faturas ou tabelas cruza `householdId`. Impedindo vazamentos de contas parceiras na mesma interface WebApp.
5. **ARQUITETO ZERO TRUST:** Sempre valide retornos HTTP com schema `zod`. Sempre aplique tokens e proteção Bearer no lado Node `getSession`. Front ends em React são cascas vazias e vulneráveis; a segurança ocorre atrás do Nginx (Express Router). 

---
*(Fim da Documentação V5 - Absolute Limit).*
