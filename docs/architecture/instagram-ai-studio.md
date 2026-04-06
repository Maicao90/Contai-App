# Instagram AI Studio

## Visao arquitetural

Este projeto foi estruturado como um monorepo PNPM com duas aplicacoes principais:

- `apps/insta-studio`: frontend SaaS em Next.js para o editor visual.
- `apps/ai-orchestrator-api`: backend Node.js com TypeScript para autenticacao, seguranca, orquestracao de modelos e integracao futura com Instagram Graph API.

A escolha por Node.js full-stack reduz friccao operacional, facilita o compartilhamento de contratos e validacoes com TypeScript, e acelera a entrega inicial do editor com IA.

## Regras arquiteturais criticas

- Conta administrativa unica: o dominio `admin` deve possuir uma estrategia de dupla protecao.
- Camada de banco: tabela `users` com coluna `role`, mais um indice unico parcial para `role = 'SUPER_ADMIN'`.
- Camada de aplicacao: servico de provisionamento administrativo com `createInitialAdmin()` idempotente; qualquer tentativa posterior de criar outro admin deve falhar com evento de auditoria.
- Painel administrativo isolado por rotas, RBAC, MFA obrigatorio, device fingerprint opcional, rate limiting agressivo, auditoria imutavel e segredo em cofre.
- Criptografia: TLS em transito, AES-256/KMS para segredos em repouso, hashing com Argon2id para credenciais, rotacao de chaves e logs sem dados sensiveis.

## Modulos prioritarios

1. Editor visual com canvas responsivo e preview em tempo real para `9:16`, `1:1` e `4:5`.
2. Pipeline de assets com upload, versionamento, mascaras, coordenadas normalizadas e exportacao.
3. Orquestrador de IA para geracao, inpainting, outpainting, remocao de fundo e segmentacao.
4. Dominio de seguranca com single-admin enforcement, trilha de auditoria e politicas anti-abuso.
5. Integracao Instagram preparada para OAuth, permissao por workspace e agendamento de publicacao.

## Arvore de diretorios

```text
.
|-- apps/
|   |-- insta-studio/
|   |   |-- package.json
|   |   |-- public/
|   |   |-- src/
|   |   |   |-- app/
|   |   |   |   |-- globals.css
|   |   |   |   |-- layout.tsx
|   |   |   |   `-- page.tsx
|   |   |   |-- components/
|   |   |   |   |-- editor/
|   |   |   |   |   `-- ImageEditor.tsx
|   |   |   |   `-- layout/
|   |   |   |-- lib/
|   |   |   |   |-- api/
|   |   |   |   |-- auth/
|   |   |   |   |-- editor/
|   |   |   |   `-- security/
|   |   |   `-- styles/
|   |   `-- tests/
|   `-- ai-orchestrator-api/
|       |-- package.json
|       |-- src/
|       |   |-- core/
|       |   |   |-- config/
|       |   |   |-- database/
|       |   |   |-- queue/
|       |   |   `-- security/
|       |   |-- modules/
|       |   |   |-- admin/
|       |   |   |-- audit/
|       |   |   |-- auth/
|       |   |   |-- health/
|       |   |   |-- images/
|       |   |   `-- instagram/
|       |   `-- shared/
|       |       `-- contracts/
|       `-- tests/
|-- packages/
|   |-- config/
|   |   |-- eslint/
|   |   `-- typescript/
|   |-- domain/
|   |   `-- src/
|   |       |-- admin/
|   |       |-- editor/
|   |       |-- images/
|   |       |-- instagram/
|   |       `-- security/
|   `-- ui/
|       `-- src/
|           |-- components/
|           `-- styles/
|-- docs/
|   `-- architecture/
|       `-- instagram-ai-studio.md
`-- infra/
    |-- docker/
    |-- supabase/
    `-- terraform/
```

## Plano de acao inicial

1. Subir o frontend com App Router, Tailwind e editor base.
2. Definir contratos do canvas: layers, masks, tools, export presets e bounding boxes.
3. Implementar o modulo `images` na API com upload seguro e fila assicrona.
4. Criar migracao de usuarios com a regra de admin unico no banco.
5. Integrar provider de IA com adaptadores por modelo.
6. Adicionar auditoria, rate limiting, WAF e hardening do painel admin antes da abertura externa.
