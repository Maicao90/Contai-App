import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
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
  status: text("status").notNull().default("Novo"),
  dataCadastro: timestamp("data_cadastro").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, dataCadastro: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export function calcScore(temSite: boolean, temPixelMeta: boolean, temPixelGoogle: boolean): number {
  let score = 0;
  if (!temSite) score += 50;
  if (!temPixelMeta) score += 20;
  if (!temPixelGoogle) score += 10;
  return score;
}
