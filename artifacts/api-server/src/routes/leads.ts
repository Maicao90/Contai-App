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

    const demoUrl = `https://${slug}.lovable.app`;

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

    const promptDemo = `Crie uma landing page completa e profissional para a empresa "${lead.nomeEmpresa}", no segmento de ${lead.nicho} em ${lead.cidade}. O domínio será ${slug}.lovable.app.

## Estrutura da página (em ordem, de cima pra baixo):

### 1. Header fixo
- Logo com nome "${lead.nomeEmpresa}" em fonte bold
- Menu simples: Serviços | Depoimentos | Contato
- Botão CTA no canto direito: "Falar no WhatsApp" (verde, com ícone do WhatsApp)

### 2. Hero Section
- Título principal impactante com a palavra-chave "${lead.nicho} em ${lead.cidade}"
- Subtítulo destacando o principal benefício (ex: "Atendimento rápido, resultado garantido")
- Dois botões: "Falar no WhatsApp" e "Ver Serviços"
- Imagem de fundo ou ilustração profissional do setor ${lead.nicho}

### 3. Seção "Por que escolher a ${lead.nomeEmpresa}?"
- 3 cards com ícone + título + descrição curta
- Diferenciais reais do segmento ${lead.nicho} (ex: experiência, qualidade, atendimento)

### 4. Serviços
- Grid de 4 a 6 cards com: ícone, nome do serviço e descrição de 2 linhas
- Serviços típicos e realistas para ${lead.nicho}

### 5. Depoimentos
- 3 depoimentos fictícios mas convincentes, com nome, foto placeholder e estrelas (5/5)
- Nomes brasileiros comuns de ${lead.cidade}

### 6. Seção de CTA final
- Fundo colorido (cor de destaque do nicho)
- Título: "Pronto para começar?"
- Botão grande: "Falar no WhatsApp agora"

### 7. Footer
- Nome da empresa, endereço fictício em ${lead.cidade}
- Telefone, horário de funcionamento
- Ícones de redes sociais (Instagram, WhatsApp, Google Maps)

## Requisitos técnicos:
- React + Tailwind CSS
- 100% responsivo (mobile-first)
- Animações suaves com framer-motion na entrada de seções
- Paleta de cores profissional para ${lead.nicho}
- Meta tags de SEO: title, description, og:image com "${lead.nicho} ${lead.cidade}"
- Link do WhatsApp no botão CTA apontando para número fictício formatado

## Importante:
- Todo o conteúdo em português brasileiro
- Tom: profissional, confiável, próximo
- Nenhum placeholder visível — tudo deve parecer um site real e pronto para usar`;

    res.json({ mensagem, whatsappUrl, promptDemo, demoUrl });
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
