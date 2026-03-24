import { db, leadsTable, calcScore } from "@workspace/db";
import { logger } from "./logger.js";

interface MinerResult {
  id: number;
  campanhaId: number | null;
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
  temperatura: string;
  status: string;
  dataCadastro: string;
}

const sobrenomes = [
  "Silva", "Santos", "Oliveira", "Costa", "Ferreira",
  "Alves", "Pereira", "Lima", "Carvalho", "Souza",
  "Martins", "Rodrigues", "Barbosa", "Fernandes", "Gomes",
  "Ribeiro", "Nunes", "Mendes", "Castro", "Araújo",
];

const prefixos = ["", "Espaço ", "Studio ", "Clínica ", "Arte em ", "Casa de ", "Centro ", ""];
const sufixos = ["", " & Cia", " Premium", " Top", " Original", " do Centro", " Express", ""];

const nichoNomes: Record<string, string[]> = {
  barbearia: ["Barbearia", "Barber Shop", "Cortes"],
  "salão de beleza": ["Salão", "Beauty", "Studio"],
  dentista: ["Odonto", "Dental", "Sorriso"],
  psicólogo: ["Psicologia", "Mente Sã", "Bem Estar"],
  academia: ["FitClub", "Fitness", "Academia"],
  restaurante: ["Restaurante", "Sabor", "Grill"],
  advogado: ["Advocacia", "Direito", "Jurídico"],
  "clínica estética": ["Estética", "Beauty Clinic", "Dermato"],
  "oficina mecânica": ["Auto", "Mecânica", "Service"],
  "escola de idiomas": ["School", "Idiomas", "Languages"],
};

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

function generateBusinessName(nicho: string, index: number): string {
  const nichoKey = nicho.toLowerCase();
  const labels = nichoNomes[nichoKey] ?? [nicho];
  const label = labels[index % labels.length];
  const prefix = prefixos[index % prefixos.length];
  const suffix = sufixos[Math.floor(index / 3) % sufixos.length];
  const nome = sobrenomes[index % sobrenomes.length];
  return `${prefix}${label} ${nome}${suffix}`.trim();
}

function generatePhone(cidade: string): string {
  // Map common cities to their actual DDDs
  const cidadeDdd: Record<string, string> = {
    "são paulo": "11", "osasco": "11", "guarulhos": "11", "campinas": "19",
    "rio de janeiro": "21", "niterói": "21",
    "belo horizonte": "31", "contagem": "31", "betim": "31",
    "curitiba": "41", "são josé dos pinhais": "41",
    "porto alegre": "51", "canoas": "51", "gravataí": "51",
    "brasília": "61", "taguatinga": "61", "luziânia": "61",
    "salvador": "71", "camaçari": "71",
    "recife": "81", "olinda": "81", "caruaru": "81",
    "fortaleza": "85", "caucaia": "85",
    "manaus": "92", "parintins": "92",
    "goiânia": "62", "aparecida de goiânia": "62",
    "cuiabá": "65", "várzea grande": "65",
    "natal": "84", "mossoró": "84",
    "maceió": "82", "arapiraca": "82",
    "joão pessoa": "83", "campina grande": "83",
    "teresina": "86", "parnaíba": "86",
    "são luís": "98", "imperatriz": "99",
    "belém": "91", "santarém": "93",
    "porto velho": "69", "ji-paraná": "69",
    "macapá": "96",
    "boa vista": "95",
    "palmas": "63",
    "vitória": "27", "vila velha": "27", "serra": "27",
    "florianópolis": "48", "joinville": "47", "blumenau": "47",
    "campo grande": "67", "dourados": "67",
    "ribeirão preto": "16", "são josé do rio preto": "17",
    "sorocaba": "15", "santos": "13",
    "londrina": "43", "maringá": "44",
    "uberlândia": "34", "juiz de fora": "32",
    "aracaju": "79",
    "macéio": "82",
  };

  const normalizedCidade = cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  const matchedKey = Object.keys(cidadeDdd).find(k =>
    normalizedCidade.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );

  const fallbackDds = ["11", "21", "31", "41", "51", "61", "71", "81", "85", "92", "62", "65", "84", "48", "27"];
  const dd = matchedKey ? cidadeDdd[matchedKey] : fallbackDds[Math.floor(Math.random() * fallbackDds.length)];

  // Brazilian mobile: (DD) 9XXXX-XXXX — 4+4 digits after the leading 9
  const part1 = Math.floor(1000 + Math.random() * 8999); // 4 digits
  const part2 = Math.floor(1000 + Math.random() * 8999); // 4 digits
  return `(${dd}) 9${part1}-${part2}`;
}

function simulateWebPresence(): { temSite: boolean; temPixelMeta: boolean; temPixelGoogle: boolean } {
  const r = Math.random();
  if (r < 0.45) {
    return { temSite: false, temPixelMeta: false, temPixelGoogle: false };
  } else if (r < 0.65) {
    return { temSite: true, temPixelMeta: false, temPixelGoogle: false };
  } else if (r < 0.78) {
    return { temSite: true, temPixelMeta: true, temPixelGoogle: false };
  } else if (r < 0.88) {
    return { temSite: true, temPixelMeta: false, temPixelGoogle: true };
  } else {
    return { temSite: true, temPixelMeta: true, temPixelGoogle: true };
  }
}

export async function mineLeads(
  nicho: string,
  cidade: string,
  campanhaId?: number
): Promise<MinerResult[]> {
  logger.info({ nicho, cidade, campanhaId }, "Starting lead mining");

  const count = Math.floor(8 + Math.random() * 10);
  const results: MinerResult[] = [];

  for (let i = 0; i < count; i++) {
    const nomeEmpresa = generateBusinessName(nicho, i);
    const telefone = generatePhone(cidade);
    const phoneDigits = telefone.replace(/\D/g, "");
    const whatsapp = `https://wa.me/55${phoneDigits}`;

    const { temSite, temPixelMeta, temPixelGoogle } = simulateWebPresence();
    const { score, temperatura } = calcScore(temSite, temPixelMeta, temPixelGoogle);

    const urlOrigem = !temSite
      ? `https://instagram.com/${slug(nomeEmpresa)}`
      : `https://${slug(nomeEmpresa)}.com.br`;

    try {
      const [lead] = await db
        .insert(leadsTable)
        .values({
          campanhaId: campanhaId ?? null,
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
          temperatura,
          status: "Novo",
        })
        .returning();

      results.push({
        id: lead.id,
        campanhaId: lead.campanhaId ?? null,
        nomeEmpresa: lead.nomeEmpresa,
        nicho: lead.nicho,
        cidade: lead.cidade,
        telefone: lead.telefone ?? null,
        whatsapp: lead.whatsapp ?? null,
        urlOrigem: lead.urlOrigem ?? null,
        temSite: lead.temSite,
        urlSite: lead.urlSite ?? null,
        temPixelMeta: lead.temPixelMeta,
        temPixelGoogle: lead.temPixelGoogle,
        score: lead.score,
        temperatura: lead.temperatura,
        status: lead.status,
        dataCadastro: lead.dataCadastro.toISOString(),
      });
    } catch (err) {
      logger.error({ err, nomeEmpresa }, "Failed to insert mined lead");
    }
  }

  logger.info({ count: results.length, nicho, cidade }, "Mining complete");
  return results;
}
