import { Router, type IRouter } from "express";
import { db, leadsTable, campanhasTable } from "@workspace/db";
import { desc, count } from "drizzle-orm";

const router: IRouter = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const leads = await db.select().from(leadsTable);
    const campaigns = await db.select().from(campanhasTable);

    const totalLeads = leads.length;
    const contatados = leads.filter((l) => l.status === "Contatado").length;
    const convertidos = leads.filter((l) => l.status === "Convertido").length;
    const quentes = leads.filter((l) => l.temperatura === "Quente").length;
    const mornos = leads.filter((l) => l.temperatura === "Morno").length;
    const frios = leads.filter((l) => l.temperatura === "Frio").length;
    const novos = leads.filter((l) => l.status === "Novo").length;
    const receitaPotencial = quentes * 3000;

    res.json({
      totalLeads,
      contatados,
      convertidos,
      receitaPotencial,
      totalCampanhas: campaigns.length,
      funil: {
        novo: novos,
        contatado: contatados,
        convertido: convertidos,
      },
      porTemperatura: {
        quente: quentes,
        morno: mornos,
        frio: frios,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/recent-leads
router.get("/dashboard/recent-leads", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10")), 50);
    const leads = await db
      .select()
      .from(leadsTable)
      .orderBy(desc(leadsTable.dataCadastro))
      .limit(limit);

    const mapped = leads.map((l) => ({
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
      score: l.score,
      temperatura: l.temperatura,
      status: l.status,
      dataCadastro: l.dataCadastro.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
