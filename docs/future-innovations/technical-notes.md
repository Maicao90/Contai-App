# Notas Técnicas Estratégicas (Fase 2)

Foco nos pilares de Visão, Inteligência e Engajamento Familiar.

## 1. Visão Computacional (Vision Pro)
- **Tecnologia**: Implementar gpt-4o (Vision) no pipeline de `media-pipeline.ts`.
- **Objetivo**: Extração de múltiplos itens de uma única nota fiscal, gerando registros de transação em lote.

## 2. Inteligência Proativa
- **Lógica**: Criar um worker (cron job) que analisa as últimas 4 semanas de gastos no `db`.
- **Canais**: Disparo de mensagens proativas via Meta API para o WhatsApp do usuário quando detectado risco de quebra de caixa ou assinaturas suspeitas.

## 3. Estrutura de Projetos
- **Schema**: Adicionar coluna `projectId` (FK) na `transactionsTable`.
- **UX**: Permitir que o usuário "abra" um projeto via comando: *"Zap, agora tudo é da Obra da Cozinha"*.

## 4. Gamificação Familiar
- **Lógica**: Comparativo de metas versus gastos reais entre os membros da Household, gerando badges ou "elogios" automáticos do bot.
