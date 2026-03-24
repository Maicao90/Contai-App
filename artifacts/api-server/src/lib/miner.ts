import { db, leadsTable, calcScore } from "@workspace/db";
import { logger } from "./logger.js";

interface MinerResult {
  id: number;
  nomeEmpresa: string;
  nicho: string;
  cidade: string;
  telefone: string | null;
  whatsapp: string | null;
  urlOrigem: string | null;
  temSite: boolean;
  urlSite: string | null;
  temPixelMeta: boolean;
  temPixelGoogle: boolean;
  score: number;
  status: string;
  dataCadastro: string;
}

// Sample business name generators to simulate lead discovery
const prefixes = ["", "Espaço ", "Studio ", "Clínica ", "Barbearia ", "Salão ", "Academia ", "Restaurante ", "Lanchonete "];
const suffixes = ["", " & Cia", " Premium", " Top", " Prime", " do Centro", " da Cidade", " Original"];

function generateBusinessName(nicho: string, index: number): string {
  const nomes = [
    "Silva", "Santos", "Oliveira", "Costa", "Ferreira",
    "Alves", "Pereira", "Lima", "Carvalho", "Souza",
    "Martins", "Rodrigues", "Barbosa", "Fernandes", "Gomes",
    "Ribeiro", "Nunes", "Mendes", "Castro", "Araújo",
  ];
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[Math.floor(index / 3) % suffixes.length];
  const nome = nomes[index % nomes.length];

  const nichoMap: Record<string, string> = {
    barbearia: "Barbearia",
    dentista: "Odonto",
    academia: "FitClub",
    restaurante: "Restaurante",
    salão: "Beauty",
    pizza: "Pizzaria",
    advogado: "Advocacia",
  };

  const nichoLabel = nichoMap[nicho.toLowerCase()] ?? nicho;
  return `${prefix}${nichoLabel} ${nome}${suffix}`.trim();
}

function generatePhone(): string {
  const dd = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92"][Math.floor(Math.random() * 10)];
  const num = Math.floor(900000000 + Math.random() * 99999999);
  return `(${dd}) 9${num}`;
}

// Simulate website/pixel detection
function simulateWebPresence(): { temSite: boolean; temPixelMeta: boolean; temPixelGoogle: boolean } {
  const r = Math.random();
  if (r < 0.45) {
    // No site at all - best prospects
    return { temSite: false, temPixelMeta: false, temPixelGoogle: false };
  } else if (r < 0.65) {
    // Has site but no pixels
    return { temSite: true, temPixelMeta: false, temPixelGoogle: false };
  } else if (r < 0.80) {
    // Has site + Meta pixel but no Google
    return { temSite: true, temPixelMeta: true, temPixelGoogle: false };
  } else if (r < 0.90) {
    // Has site + Google but no Meta
    return { temSite: true, temPixelMeta: false, temPixelGoogle: true };
  } else {
    // Has everything
    return { temSite: true, temPixelMeta: true, temPixelGoogle: true };
  }
}

export async function mineLeads(nicho: string, cidade: string): Promise<MinerResult[]> {
  logger.info({ nicho, cidade }, "Starting lead mining");

  const count = Math.floor(8 + Math.random() * 12); // 8-19 leads
  const results: MinerResult[] = [];

  for (let i = 0; i < count; i++) {
    const nomeEmpresa = generateBusinessName(nicho, i);
    const telefone = generatePhone();
    const phoneDigits = telefone.replace(/\D/g, "");
    const whatsapp = `https://wa.me/55${phoneDigits}`;

    const { temSite, temPixelMeta, temPixelGoogle } = simulateWebPresence();
    const score = calcScore(temSite, temPixelMeta, temPixelGoogle);

    const urlOrigem = !temSite
      ? `https://instagram.com/${nomeEmpresa.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}`
      : `https://${nomeEmpresa.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com.br`;

    try {
      const [lead] = await db
        .insert(leadsTable)
        .values({
          nomeEmpresa,
          nicho,
          cidade,
          telefone,
          whatsapp,
          urlOrigem,
          temSite,
          urlSite: temSite ? urlOrigem : null,
          temPixelMeta,
          temPixelGoogle,
          score,
          status: "Novo",
        })
        .returning();

      results.push({
        ...lead,
        dataCadastro: lead.dataCadastro.toISOString(),
      });
    } catch (err) {
      logger.error({ err, nomeEmpresa }, "Failed to insert lead");
    }
  }

  logger.info({ count: results.length, nicho, cidade }, "Lead mining complete");
  return results;
}
