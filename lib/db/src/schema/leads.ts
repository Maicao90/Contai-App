import { pgTable, serial, text, boolean, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campanhasTable = pgTable("campanhas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  nicho: text("nicho").notNull(),
  cidade: text("cidade").notNull(),
  uf: text("uf").notNull().default("SP"),
  status: text("status").notNull().default("Ativa"),
  taxaConversao: real("taxa_conversao"),
  dataCriacao: timestamp("data_criacao").notNull().defaultNow(),
});

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  campanhaId: integer("campanha_id"),
  nomeEmpresa: text("nome_empresa").notNull(),
  nicho: text("nicho").notNull(),
  cidade: text("cidade").notNull(),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  urlOrigem: text("url_origem"),
  temSite: boolean("tem_site").notNull().default(false),
  urlSite: text("url_site"),
  temPixelMeta: boolean("tem_pixel_meta").notNull().default(false),
  temPixelGoogle: boolean("tem_pixel_google").notNull().default(false),
  temGoogleMeuNegocio: boolean("tem_google_meu_negocio").notNull().default(false),
  notaGoogle: real("nota_google"),
  urlInstagram: text("url_instagram"),
  score: integer("score").notNull().default(0),
  temperatura: text("temperatura").notNull().default("Frio"),
  status: text("status").notNull().default("Novo"),
  dataCadastro: timestamp("data_cadastro").notNull().defaultNow(),
});

export const demoPagesTable = pgTable("demo_pages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  html: text("html").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, dataCadastro: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export const insertCampaignSchema = createInsertSchema(campanhasTable).omit({ id: true, dataCriacao: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campanhasTable.$inferSelect;

/**
 * Índice de Oportunidade de Venda — 0 a 100
 *
 * Quanto maior o score, maior a oportunidade de fechar negócio,
 * porque o prospect tem mais lacunas digitais que podemos resolver.
 *
 * Critérios:
 *   Sem site              → +70 pts  (maior gap: empresa invisível online)
 *   Sem Pixel Meta        → +35 pts  (não consegue rastrear anúncios)
 *   Sem Pixel Google      → +20 pts  (sem analytics nem remarketing Google)
 *   Base                  → +15 pts  (qualquer prospect vale ser abordado)
 *
 * Temperatura:
 *   Quente  → score ≥ 70  (oportunidade alta, abordagem urgente)
 *   Morno   → score ≥ 35  (oportunidade média, bom para trabalhar)
 *   Frio    → score < 35  (já configurado, argumento mais difícil)
 */
export function calcScore(
  temSite: boolean,
  temPixelMeta: boolean,
  temPixelGoogle: boolean
): { score: number; temperatura: string } {
  let score = 15; // base

  if (!temSite) {
    score += 70; // sem site = empresa inexistente na internet
  } else {
    if (!temPixelMeta) score += 35;   // não consegue rodar/medir Meta Ads
    if (!temPixelGoogle) score += 20; // sem analytics nem remarketing Google
  }

  const temperatura =
    score >= 70 ? "Quente" : score >= 35 ? "Morno" : "Frio";

  return { score, temperatura };
}

/**
 * Retorna os fatores individuais que compõem o score,
 * para exibir breakdown no frontend.
 */
export function calcScoreBreakdown(
  temSite: boolean,
  temPixelMeta: boolean,
  temPixelGoogle: boolean
): Array<{ label: string; pontos: number; presente: boolean }> {
  return [
    {
      label: "Sem site próprio",
      pontos: 70,
      presente: !temSite,
    },
    {
      label: "Sem Pixel Meta (anúncios)",
      pontos: 35,
      presente: temSite && !temPixelMeta,
    },
    {
      label: "Sem Pixel Google (analytics)",
      pontos: 20,
      presente: temSite && !temPixelGoogle,
    },
    {
      label: "Base (todo prospect tem valor)",
      pontos: 15,
      presente: true,
    },
  ];
}
