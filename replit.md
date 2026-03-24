# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains ProspectaLP — a B2B lead prospecting SaaS dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, React Query, framer-motion, recharts, lucide-react

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── prospecta-bot/      # ProspectaLP React frontend (serves at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## ProspectaLP Features

- **Dashboard**: KPI cards (Total de Leads, Contatados, Convertidos, Receita Potencial), Funil de Conversão chart, Temperatura dos Leads breakdown, Leads Recentes table
- **Campanhas**: Grid of campaign cards, "+ Nova Campanha" modal with automatic lead mining on creation
- **Leads**: Filterable table by campanha/temperatura/status, inline status update dropdown, message modal
- **Message Modal**: Auto-generated WhatsApp outreach message, copy button, WhatsApp Web link, Lovable/v0.dev prompt for landing page generation

## Database Schema

### `campanhas` table
- id, nome, nicho, cidade, uf, status (Ativa/Concluída/Pausada), taxaConversao, dataCriacao

### `leads` table
- id, campanhaId (FK), nomeEmpresa, nicho, cidade, telefone, whatsapp, urlOrigem
- temSite, urlSite, temPixelMeta, temPixelGoogle
- score (45=Quente/Sem Site, 25=Morno/Sem Pixel, 10=Frio)
- temperatura (Quente/Morno/Frio), status (Novo/Contatado/Convertido)
- dataCadastro

## API Endpoints

- `GET /api/dashboard/stats` — KPI stats + funnel + temperature breakdown
- `GET /api/dashboard/recent-leads` — Last N leads
- `GET/POST /api/campaigns` — List / create campaigns
- `GET/DELETE /api/campaigns/:id` — Get / delete campaign
- `GET/POST /api/leads` — List (with filters) / create leads
- `PATCH/DELETE /api/leads/:id` — Update / delete lead
- `GET /api/leads/:id/message` — Get WhatsApp outreach message + promptDemo
- `POST /api/mine` — Mine leads for a nicho+cidade (with optional campanhaId)

## Score Calculation
- Sem Site → score: 45, temperatura: Quente
- Com Site, Sem Pixel → score: 25, temperatura: Morno  
- Com Site + Pixel → score: 10, temperatura: Frio
