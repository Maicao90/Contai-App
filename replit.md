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
- **Campanhas**: Grid of campaign cards with nicho conversion rate badges, "+ Nova Campanha" modal with automatic lead mining on creation
- **Leads**: Filterable table (search, campanha, 24 nichos, temperatura, status), nicho conversion rate badges, inline status update, click to open detail page
- **Lead Detail** (`/leads/:id`): Full page with Informações, Análise do Site (score breakdown), Alterar Status (Novo/Contatado/Convertido/Perdido/Ignorado), Score circle, Landing Page Demo section, Replit Agent prompts (Blueprint/Genérico/Compacto), Gerar Mensagem (1º Contato / Follow-up + WhatsApp button)
- **Landing Page Demo**: One-click generation — backend creates a complete, professional, nicho-aware HTML page and serves it immediately at `/api/demo/:slug`. URL is displayed with copy button.
- **Replit Agent Prompts**: 3 variants (Blueprint/Genérico/Compacto) auto-generated per lead for manual LP creation in Replit
- **WhatsApp Outreach**: Auto-generated message based on lead profile (sem site / sem pixel / geral), editable, opens in WhatsApp Web

## Nichos Supported (24)

Barbearia, Salão de Beleza, Dentista, Clínica Odontológica, Psicólogo, Terapeuta, Nutricionista, Academia, Personal Trainer, Clínica Veterinária, Pet Shop, Advogado, Arquiteto, Designer de Interiores, Escola de Idiomas, Escola de Natação, Escola de Música, Escola de Dança, Cerimonialista, Fotógrafo, Restaurante, Oficina Mecânica, Clínica de Fisioterapia, Clínica Estética

## Database Schema

### `campanhas` table
- id, nome, nicho, cidade, uf, status (Ativa/Concluída/Pausada), taxaConversao, dataCriacao

### `leads` table
- id, campanhaId (FK), nomeEmpresa, nicho, cidade, telefone, whatsapp, urlOrigem
- temSite, urlSite, temPixelMeta, temPixelGoogle
- score (0-100), temperatura (Quente ≥70 / Morno ≥35 / Frio <35)
- status (Novo/Contatado/Convertido/Perdido/Ignorado), dataCadastro

### `demo_pages` table
- id, leadId (FK unique), slug (unique), html (full HTML), createdAt, updatedAt

## API Endpoints

- `GET /api/dashboard/stats` — KPI stats + funnel + temperature breakdown
- `GET /api/dashboard/recent-leads` — Last N leads
- `GET/POST /api/campaigns` — List / create campaigns
- `GET/DELETE /api/campaigns/:id` — Get / delete campaign
- `GET/POST /api/leads` — List (with filters) / create leads
- `PATCH/DELETE /api/leads/:id` — Update / delete lead
- `GET /api/leads/:id/message` — Get WhatsApp outreach message + 3 prompts + demoUrl
- `POST /api/leads/:id/generate-demo` — Generate nicho-aware HTML demo page, save to DB, return demoPath
- `GET /api/demo/:slug` — Serve generated HTML demo page (text/html)
- `POST /api/mine` — Mine leads for a nicho+cidade (with optional campanhaId)

## Score Calculation
- Base: +15pts (always)
- Sem site: +70pts → Quente (≥70)
- Com site, Sem Pixel Meta: +35pts → Morno (≥35)
- Com site, Sem Pixel Google: +20pts
- Temperatura: Quente ≥70 | Morno ≥35 | Frio <35

## Demo Generator (artifacts/api-server/src/lib/demo-generator.ts)
Generates complete, self-contained HTML landing pages per nicho with:
- Nicho-specific color palette, services (6), differentials (3), FAQs (6), testimonials (3)
- Tailwind CSS via CDN, Inter font, smooth animations, mobile-first
- FAQ accordion, scroll reveal, WhatsApp CTA buttons with lead's phone
- "Demo — ProspectaLP" badge at bottom
- Supports 16 nichos natively with intelligent fuzzy fallback matching
