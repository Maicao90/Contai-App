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
  score: integer("score").notNull().default(0),
  temperatura: text("temperatura").notNull().default("Frio"),
  status: text("status").notNull().default("Novo"),
  dataCadastro: timestamp("data_cadastro").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, dataCadastro: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export const insertCampaignSchema = createInsertSchema(campanhasTable).omit({ id: true, dataCriacao: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campanhasTable.$inferSelect;

export function calcScore(temSite: boolean, temPixelMeta: boolean, temPixelGoogle: boolean): {
  score: number;
  temperatura: string;
} {
  if (!temSite) {
    return { score: 45, temperatura: "Quente" };
  } else if (!temPixelMeta && !temPixelGoogle) {
    return { score: 25, temperatura: "Morno" };
  } else {
    return { score: 10, temperatura: "Frio" };
  }
}
