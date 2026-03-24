import { Router, type IRouter } from "express";
import { db, campanhasTable, leadsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateCampaignBody } from "@workspace/api-zod";
import { mineLeads } from "../lib/miner.js";

const router: IRouter = Router();

// GET /campaigns
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await db.select().from(campanhasTable).orderBy(campanhasTable.dataCriacao);

    const leadsCount = await db
      .select({ campanhaId: leadsTable.campanhaId, count: count() })
      .from(leadsTable)
      .groupBy(leadsTable.campanhaId);

    const countMap = new Map(leadsCount.map((l) => [l.campanhaId, Number(l.count)]));

    const result = campaigns.map((c) => ({
      id: c.id,
      nome: c.nome,
      nicho: c.nicho,
      cidade: c.cidade,
      uf: c.uf,
      status: c.status,
      taxaConversao: c.taxaConversao ?? null,
      totalLeads: countMap.get(c.id) ?? 0,
      dataCriacao: c.dataCriacao.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list campaigns");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /campaigns
router.post("/campaigns", async (req, res) => {
  try {
    const body = CreateCampaignBody.parse(req.body);

    const [campaign] = await db
      .insert(campanhasTable)
      .values({
        nome: body.nome,
        nicho: body.nicho,
        cidade: body.cidade,
        uf: body.uf,
        status: "Ativa",
      })
      .returning();

    // Start mining in background
    mineLeads(body.nicho, body.cidade, campaign.id).catch((err) => {
      req.log.error({ err }, "Background mining failed");
    });

    res.status(201).json({
      id: campaign.id,
      nome: campaign.nome,
      nicho: campaign.nicho,
      cidade: campaign.cidade,
      uf: campaign.uf,
      status: campaign.status,
      taxaConversao: campaign.taxaConversao ?? null,
      totalLeads: 0,
      dataCriacao: campaign.dataCriacao.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create campaign");
    res.status(400).json({ error: "Invalid request" });
  }
});

// GET /campaigns/:id
router.get("/campaigns/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [campaign] = await db.select().from(campanhasTable).where(eq(campanhasTable.id, id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const [leadsResult] = await db
      .select({ count: count() })
      .from(leadsTable)
      .where(eq(leadsTable.campanhaId, id));

    res.json({
      ...campaign,
      totalLeads: Number(leadsResult?.count ?? 0),
      taxaConversao: campaign.taxaConversao ?? null,
      dataCriacao: campaign.dataCriacao.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get campaign");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /campaigns/:id
router.delete("/campaigns/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await db.delete(campanhasTable).where(eq(campanhasTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete campaign");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
