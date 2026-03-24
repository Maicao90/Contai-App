import { Router, type IRouter } from "express";
import { db, leadsTable, calcScore } from "@workspace/db";
import { demoPagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListLeadsQueryParams,
  CreateLeadBody,
  UpdateLeadBody,
  MineLeadsBody,
} from "@workspace/api-zod";
import { mineLeads } from "../lib/miner.js";
import { generateDemoHtml } from "../lib/demo-generator.js";

const router: IRouter = Router();

function mapLead(l: typeof leadsTable.$inferSelect) {
  return {
    id: l.id,
    campanhaId: l.campanhaId ?? null,
    nomeEmpresa: l.nomeEmpresa,
    nicho: l.nicho,
    cidade: l.cidade,
    telefone: l.telefone ?? null,
    whatsapp: l.whatsapp ?? null,
    urlOrigem: l.urlOrigem ?? null,
    temSite: l.temSite,
    urlSite: l.urlSite ?? null,
    temPixelMeta: l.temPixelMeta,
    temPixelGoogle: l.temPixelGoogle,
    temGoogleMeuNegocio: l.temGoogleMeuNegocio,
    notaGoogle: l.notaGoogle ?? null,
    urlInstagram: l.urlInstagram ?? null,
    score: l.score,
    temperatura: l.temperatura,
    status: l.status,
    dataCadastro: l.dataCadastro.toISOString(),
  };
}

// GET /leads
router.get("/leads", async (req, res) => {
  try {
    const parsed = ListLeadsQueryParams.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    let leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.score));

    if (filters.campanhaId) {
      leads = leads.filter((l) => l.campanhaId === Number(filters.campanhaId));
    }
    if (filters.status) {
      leads = leads.filter((l) => l.status === filters.status);
    }
    if (filters.temperatura) {
      leads = leads.filter((l) => l.temperatura === filters.temperatura);
    }
    if (filters.nicho) {
      leads = leads.filter((l) =>
        l.nicho.toLowerCase().includes((filters.nicho as string).toLowerCase())
      );
    }
    if (filters.cidade) {
      leads = leads.filter((l) =>
        l.cidade.toLowerCase().includes((filters.cidade as string).toLowerCase())
      );
    }

    res.json(leads.map(mapLead));
  } catch (err) {
    req.log.error({ err }, "Failed to list leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /leads
router.post("/leads", async (req, res) => {
  try {
    const body = CreateLeadBody.parse(req.body);
    const temSite = body.temSite ?? false;
    const temPixelMeta = body.temPixelMeta ?? false;
    const temPixelGoogle = body.temPixelGoogle ?? false;
    const { score, temperatura } = calcScore(temSite, temPixelMeta, temPixelGoogle);

    const [lead] = await db
      .insert(leadsTable)
      .values({
        campanhaId: body.campanhaId ?? null,
        nomeEmpresa: body.nomeEmpresa,
        nicho: body.nicho,
        cidade: body.cidade,
        telefone: body.telefone ?? null,
        whatsapp: body.whatsapp ?? null,
        urlOrigem: body.urlOrigem ?? null,
        temSite,
        urlSite: body.urlSite ?? null,
        temPixelMeta,
        temPixelGoogle,
        score,
        temperatura,
        status: "Novo",
      })
      .returning();

    res.status(201).json(mapLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to create lead");
    res.status(400).json({ error: "Invalid request" });
  }
});

// GET /leads/:id/message — before /leads/:id
router.get("/leads/:id/message", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Generate a URL-friendly slug from company name
    const slug = lead.nomeEmpresa
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const demoUrl = `https://${slug}.replit.app`;

    let mensagem = "";

    if (!lead.temSite) {
      mensagem = `Oi *${lead.nomeEmpresa}*! Tudo bem? 😊

Pesquisei *"${lead.nicho} em ${lead.cidade}"* e a ${lead.nomeEmpresa} não aparece no Google. Isso = clientes indo pro concorrente. 😬

Criei uma demonstração de como ficaria o site de vocês:
🔥 ${demoUrl}

Essa página fica pronta em *24 horas*, otimizada pro celular e pro Google.
👍 Investimento: R$ 1.997 (ou 12x de R$ 197)

Dá uma olhada no link e me diz o que achou?`;
    } else if (!lead.temPixelMeta && !lead.temPixelGoogle) {
      mensagem = `Oi *${lead.nomeEmpresa}*! Tudo bem? 😊

Vi que vocês têm site, mas ele não está rastreando os visitantes — sem Pixel da Meta nem Tag do Google. Isso = você investe em anúncio e não sabe o que tá funcionando. 😬

Configuro tudo pra vocês e ainda otimizo a página pra converter mais:
🔥 ${demoUrl}

Entrego em *24 horas*, pronto pra rodar campanhas que vendem de verdade.
👍 Investimento: R$ 1.497 (ou 12x de R$ 147)

Dá uma olhada e me diz o que achou?`;
    } else {
      mensagem = `Oi *${lead.nomeEmpresa}*! Tudo bem? 😊

Analisei a presença digital de vocês e vi algumas oportunidades de melhorar a captação de clientes em ${lead.cidade}.

Criei uma proposta de como ficaria a nova landing page de vocês:
🔥 ${demoUrl}

Entrego em *24 horas*, otimizada pro celular e pro Google.
👍 Investimento: R$ 1.997 (ou 12x de R$ 197)

Dá uma olhada e me diz o que achou?`;
    }

    const rawPhone = lead.telefone?.replace(/\D/g, "") ?? "";
    const whatsappUrl = rawPhone.length >= 10
      ? `https://wa.me/55${rawPhone}?text=${encodeURIComponent(mensagem)}`
      : null;

    // ── PROMPT 1: Blueprint Completo ──────────────────────────────────────────
    const promptBlueprint = `Crie uma landing page completa para "${lead.nomeEmpresa}" (${lead.nicho} em ${lead.cidade}).
Hospedagem: Replit (domínio ${slug}.replit.app).

## Stack técnica
- React + Vite + TypeScript
- Tailwind CSS (estilização), Framer Motion (animações), Lucide React (ícones)
- 100% responsivo, mobile-first

## Seções obrigatórias (de cima pra baixo)

### 1. Header fixo
- Logo: "${lead.nomeEmpresa}" em fonte bold
- Menu: Serviços | Depoimentos | FAQ | Contato
- CTA fixo direito: "Falar no WhatsApp" (fundo #25D366, ícone WhatsApp)
- Ao rolar, header ganha fundo sólido escuro + sombra suave

### 2. Hero
- Título: palavra-chave "${lead.nicho} em ${lead.cidade}" com variação criativa e impactante
- Subtítulo: principal benefício do segmento (curto, direto)
- Badge: "⭐ Mais de 500 clientes satisfeitos"
- 2 botões: "Agendar Agora" (primário) + "Ver Serviços" (âncora interna)
- Background: gradiente sutil ou imagem cover do setor

### 3. Diferenciais
- Título: "Por que escolher a ${lead.nomeEmpresa}?"
- 3 cards horizontais: ícone Lucide + título + descrição de 2 linhas
- Diferenciais específicos e realistas para ${lead.nicho}

### 4. Serviços
- Título: "Nossos Serviços"
- Grid 2×3 (mobile: 1 coluna): ícone + nome + descrição breve
- 6 serviços típicos e realistas para ${lead.nicho}

### 5. FAQ (accordion)
- 6 perguntas reais que clientes de ${lead.nicho} fazem
- Cada item expande/fecha com animação suave
- Respostas objetivas de 2-3 linhas
- Última pergunta: "Como agendar?" com CTA inline para WhatsApp

### 6. Depoimentos
- Título: "O que nossos clientes dizem"
- 3 cards: avatar com iniciais coloridas, nome brasileiro, cidade ${lead.cidade}, 5 estrelas, texto convincente e específico para ${lead.nicho}

### 7. CTA Final
- Fundo com cor de destaque do nicho
- Título grande: "Pronto para começar?"
- Parágrafo de urgência (ex: "Atendemos com hora marcada — vagas limitadas essa semana!")
- Botão grande verde: "Falar no WhatsApp agora" (wa.me/55 + número fictício 11 dígitos)

### 8. Footer
- Nome, endereço fictício em ${lead.cidade}, horário de funcionamento típico para ${lead.nicho}
- Ícones: Instagram, WhatsApp, Google Maps (links para #)
- Copyright ${new Date().getFullYear()} ${lead.nomeEmpresa}

## SEO
- <title>${lead.nicho} em ${lead.cidade} | ${lead.nomeEmpresa}</title>
- meta description: 150 chars sobre o serviço
- og:title, og:description, og:type: website

## Regras de conteúdo
- 100% em português brasileiro, tom profissional e próximo
- Cores: paleta adequada ao segmento ${lead.nicho}
- Sem placeholders — tudo deve parecer site real e entregue ao cliente`;

    // ── PROMPT 2: Genérico ────────────────────────────────────────────────────
    const promptGenerico = `Crie uma landing page profissional para "${lead.nomeEmpresa}", empresa de ${lead.nicho} em ${lead.cidade}.
Hospedagem: Replit (${slug}.replit.app). Stack: React + Vite + Tailwind CSS + Framer Motion.

Seções obrigatórias:
1. Header fixo com logo e botão "Falar no WhatsApp" (#25D366)
2. Hero: título com "${lead.nicho} em ${lead.cidade}", subtítulo impactante, 2 CTAs
3. Diferenciais: 3 cards (ícone + título + descrição) para ${lead.nicho}
4. Serviços: grid 2×3 com 6 serviços típicos de ${lead.nicho}
5. FAQ: accordion com 5 perguntas reais de clientes do segmento
6. Depoimentos: 3 cards com nome brasileiro, 5 estrelas e texto convincente
7. CTA final: fundo colorido, título urgente, botão WhatsApp grande
8. Footer: endereço em ${lead.cidade}, horário, redes sociais

Mobile-first, animações suaves de entrada, paleta de cores adequada ao ${lead.nicho}.
Conteúdo 100% em português brasileiro. Sem placeholders — tudo parece site real.`;

    // ── PROMPT 3: Compacto ────────────────────────────────────────────────────
    const promptCompacto = `Landing page para "${lead.nomeEmpresa}" — ${lead.nicho} em ${lead.cidade}.
Replit | React + Vite + Tailwind CSS | Domínio: ${slug}.replit.app

Inclua: Header com CTA WhatsApp • Hero com título "${lead.nicho} em ${lead.cidade}" • 3 diferenciais • Grade de 6 serviços • FAQ accordion (5 perguntas do segmento) • 3 depoimentos com 5 estrelas • CTA final com botão WhatsApp verde • Footer com endereço em ${lead.cidade}.

Idioma: PT-BR. Mobile-first. Sem placeholders. Parece site real entregue ao cliente.
Botão WhatsApp: fundo #25D366, wa.me/55 + número fictício de ${lead.cidade}.`;

    res.json({ mensagem, whatsappUrl, promptDemo: promptBlueprint, prompts: { blueprint: promptBlueprint, generico: promptGenerico, compacto: promptCompacto }, demoUrl });
  } catch (err) {
    req.log.error({ err }, "Failed to get lead message");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leads/:id
router.get("/leads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    res.json(mapLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to get lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /leads/:id
router.patch("/leads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const body = UpdateLeadBody.parse(req.body);
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.temperatura !== undefined) updateData.temperatura = body.temperatura;
    if (body.nomeEmpresa !== undefined) updateData.nomeEmpresa = body.nomeEmpresa;
    if (body.nicho !== undefined) updateData.nicho = body.nicho;
    if (body.cidade !== undefined) updateData.cidade = body.cidade;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;
    if (body.urlSite !== undefined) updateData.urlSite = body.urlSite;
    if (body.campanhaId !== undefined) updateData.campanhaId = body.campanhaId;

    if (
      body.temSite !== undefined ||
      body.temPixelMeta !== undefined ||
      body.temPixelGoogle !== undefined
    ) {
      const [existing] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
      if (!existing) return res.status(404).json({ error: "Lead not found" });

      const temSite = body.temSite ?? existing.temSite;
      const temPixelMeta = body.temPixelMeta ?? existing.temPixelMeta;
      const temPixelGoogle = body.temPixelGoogle ?? existing.temPixelGoogle;
      const { score, temperatura } = calcScore(temSite, temPixelMeta, temPixelGoogle);

      updateData.temSite = temSite;
      updateData.temPixelMeta = temPixelMeta;
      updateData.temPixelGoogle = temPixelGoogle;
      updateData.score = score;
      if (!body.temperatura) updateData.temperatura = temperatura;
    }

    const [updated] = await db
      .update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Lead not found" });

    res.json(mapLead(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update lead");
    res.status(400).json({ error: "Invalid request" });
  }
});

// DELETE /leads/:id
router.delete("/leads/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await db.delete(leadsTable).where(eq(leadsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /leads/:id/generate-demo
router.post("/leads/:id/generate-demo", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const baseSlug = lead.nomeEmpresa
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const slug = `${baseSlug}-${id}`;
    const html = generateDemoHtml({
      nomeEmpresa: lead.nomeEmpresa,
      nicho: lead.nicho,
      cidade: lead.cidade,
      telefone: lead.telefone,
      whatsapp: lead.whatsapp,
    });

    // Upsert demo page
    const existing = await db.select().from(demoPagesTable).where(eq(demoPagesTable.leadId, id));
    if (existing.length > 0) {
      await db.update(demoPagesTable)
        .set({ html, slug, updatedAt: new Date() })
        .where(eq(demoPagesTable.leadId, id));
    } else {
      await db.insert(demoPagesTable).values({ leadId: id, slug, html });
    }

    res.json({ slug, demoPath: `/api/demo/${slug}` });
  } catch (err) {
    req.log.error({ err }, "Failed to generate demo");
    res.status(500).json({ error: "Failed to generate demo" });
  }
});

// GET /demo/:slug — serve HTML demo page
router.get("/demo/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [page] = await db.select().from(demoPagesTable).where(eq(demoPagesTable.slug, slug));
    if (!page) {
      res.status(404).send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Não encontrado</title><style>body{font-family:sans-serif;background:#0d0d1a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;gap:16px}</style></head><body><h1 style="font-size:4rem;margin:0">404</h1><p style="color:rgba(255,255,255,.6)">Demonstração não encontrada.</p><a href="/" style="color:#7c3aed">Voltar</a></body></html>`);
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(page.html);
  } catch (err) {
    req.log.error({ err }, "Failed to serve demo");
    res.status(500).send("Erro interno");
  }
});

// POST /mine
router.post("/mine", async (req, res) => {
  try {
    const body = MineLeadsBody.parse(req.body);
    const leads = await mineLeads(body.nicho, body.cidade, body.campanhaId ?? undefined);

    res.json({
      found: leads.length,
      leads,
      message: `Mineração concluída! ${leads.length} leads encontrados para ${body.nicho} em ${body.cidade}.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to mine leads");
    res.status(500).json({ error: "Mining failed" });
  }
});

export default router;
