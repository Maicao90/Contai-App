import { Router, type IRouter } from "express";
import { db, leadsTable, calcScore } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListLeadsQueryParams,
  CreateLeadBody,
  UpdateLeadBody,
  MineLeadsBody,
} from "@workspace/api-zod";
import { mineLeads } from "../lib/miner.js";

const router: IRouter = Router();

// GET /leads/stats — must come before /leads/:id
router.get("/leads/stats", async (req, res) => {
  try {
    const leads = await db.select().from(leadsTable);
    const totalLeads = leads.length;
    const leadsQuentes = leads.filter((l) => l.status === "Quente").length;
    const contatados = leads.filter((l) => l.status === "Contatado").length;
    const convertidos = leads.filter((l) => l.status === "Convertido").length;
    const receitaPotencial = convertidos * 1500 + leadsQuentes * 500;

    res.json({
      totalLeads,
      leadsQuentes,
      contatados,
      convertidos,
      receitaPotencial,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leads
router.get("/leads", async (req, res) => {
  try {
    const parsed = ListLeadsQueryParams.safeParse(req.query);
    const filters = parsed.success ? parsed.data : {};

    let query = db.select().from(leadsTable).orderBy(desc(leadsTable.score));
    const leads = await query;

    let filtered = leads;
    if (filters.status) {
      filtered = filtered.filter((l) => l.status === filters.status);
    }
    if (filters.nicho) {
      filtered = filtered.filter((l) =>
        l.nicho.toLowerCase().includes((filters.nicho as string).toLowerCase())
      );
    }
    if (filters.cidade) {
      filtered = filtered.filter((l) =>
        l.cidade.toLowerCase().includes((filters.cidade as string).toLowerCase())
      );
    }

    const mapped = filtered.map((l) => ({
      id: l.id,
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
      score: l.score,
      status: l.status,
      dataCadastro: l.dataCadastro.toISOString(),
    }));

    res.json(mapped);
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
    const score = calcScore(temSite, temPixelMeta, temPixelGoogle);

    const [lead] = await db
      .insert(leadsTable)
      .values({
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
        status: "Novo",
      })
      .returning();

    res.status(201).json({
      ...lead,
      dataCadastro: lead.dataCadastro.toISOString(),
    });
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

    let mensagem = "";

    if (!lead.temSite) {
      mensagem = `Olá! Tudo bem? 😊

Sou especialista em marketing digital e vi que a *${lead.nomeEmpresa}* ainda não tem um site próprio. Hoje em dia, ter um site profissional é essencial para atrair mais clientes e se destacar no mercado de ${lead.nicho} em ${lead.cidade}.

Já criei sites para vários negócios da região e os resultados foram incríveis — mais clientes, mais visibilidade e mais vendas.

Posso te mostrar um exemplo de como ficaria o site da ${lead.nomeEmpresa} completamente grátis, sem compromisso. Seria interessante para você?`;
    } else if (!lead.temPixelMeta) {
      mensagem = `Olá! Tudo bem? 😊

Vi que a *${lead.nomeEmpresa}* tem um site, mas ele ainda não está configurado para acompanhar os resultados de campanhas no Facebook/Instagram. Isso significa que você pode estar perdendo vendas sem nem saber.

O Pixel da Meta é uma ferramenta gratuita que, quando bem configurada, permite escalar campanhas de forma muito mais eficiente.

Posso fazer uma análise gratuita do site de vocês e mostrar o que está sendo perdido. Teria interesse?`;
    } else {
      mensagem = `Olá! Tudo bem? 😊

Encontrei a *${lead.nomeEmpresa}* e fiquei curioso para entender melhor como vocês estão captando clientes digitalmente. Trabalho com estratégias de crescimento para ${lead.nicho} em ${lead.cidade} e tenho ajudado negócios a aumentar o faturamento com marketing digital.

Teria 5 minutos para uma conversa rápida?`;
    }

    const telefone = lead.telefone?.replace(/\D/g, "") || lead.whatsapp?.replace(/\D/g, "");
    const encodedMsg = encodeURIComponent(mensagem);
    const whatsappUrl = telefone
      ? `https://wa.me/55${telefone}?text=${encodedMsg}`
      : null;

    const promptDemo = `Crie uma landing page profissional para a empresa "${lead.nomeEmpresa}", que atua no segmento de ${lead.nicho} em ${lead.cidade}.

A página deve ter:
- Header com logo e nome da empresa
- Hero section com chamada principal voltada para o público local
- Seção de serviços oferecidos (3 a 5 cards)
- Seção de depoimentos de clientes (3 fictícios)
- Seção "Por que nos escolher?" com diferenciais
- Formulário de contato ou botão do WhatsApp
- Footer com endereço e horário de funcionamento

Design: moderno, cores que transmitam confiança e profissionalismo para o setor de ${lead.nicho}. Mobile-first. Usar Tailwind CSS.`;

    res.json({ mensagem, whatsappUrl, promptDemo });
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

    res.json({ ...lead, dataCadastro: lead.dataCadastro.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get lead" );
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
    if (body.nomeEmpresa !== undefined) updateData.nomeEmpresa = body.nomeEmpresa;
    if (body.nicho !== undefined) updateData.nicho = body.nicho;
    if (body.cidade !== undefined) updateData.cidade = body.cidade;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;
    if (body.urlSite !== undefined) updateData.urlSite = body.urlSite;

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

      updateData.temSite = temSite;
      updateData.temPixelMeta = temPixelMeta;
      updateData.temPixelGoogle = temPixelGoogle;
      updateData.score = calcScore(temSite, temPixelMeta, temPixelGoogle);
    }

    const [updated] = await db
      .update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Lead not found" });

    res.json({ ...updated, dataCadastro: updated.dataCadastro.toISOString() });
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

// POST /mine
router.post("/mine", async (req, res) => {
  try {
    const body = MineLeadsBody.parse(req.body);
    const leads = await mineLeads(body.nicho, body.cidade);

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
