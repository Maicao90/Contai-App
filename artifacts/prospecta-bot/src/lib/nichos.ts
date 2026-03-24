export interface NichoInfo {
  nome: string;
  conversao: number; // percentual ex: 14.7 = 14.7%
}

/** Nichos ordenados por taxa de conversão (maior → menor) */
export const NICHOS: NichoInfo[] = [
  { nome: "Clínica Odontológica",       conversao: 17.2 },
  { nome: "Dentista",                   conversao: 16.8 },
  { nome: "Salão de Beleza",            conversao: 15.4 },
  { nome: "Psicólogo",                  conversao: 15.2 },
  { nome: "Terapeuta",                  conversao: 15.0 },
  { nome: "Nutricionista",              conversao: 14.8 },
  { nome: "Barbearia",                  conversao: 14.7 },
  { nome: "Clínica Estética",           conversao: 14.5 },
  { nome: "Fotógrafo",                  conversao: 14.2 },
  { nome: "Clínica Médica",             conversao: 13.8 },
  { nome: "Personal Trainer",           conversao: 13.5 },
  { nome: "Clínica de Fisioterapia",    conversao: 13.2 },
  { nome: "Arquiteto",                  conversao: 13.0 },
  { nome: "Designer de Interiores",     conversao: 12.9 },
  { nome: "Academia",                   conversao: 12.8 },
  { nome: "Spa & Massagem",             conversao: 12.6 },
  { nome: "Clínica Veterinária",        conversao: 12.3 },
  { nome: "Manicure & Nail Designer",   conversao: 12.1 },
  { nome: "Advogado",                   conversao: 12.1 },
  { nome: "Energia Solar",              conversao: 11.9 },
  { nome: "Móveis Planejados",          conversao: 11.7 },
  { nome: "Restaurante",                conversao: 11.5 },
  { nome: "Contabilidade",              conversao: 11.2 },
  { nome: "Imobiliária",               conversao: 10.9 },
  { nome: "Oficina Mecânica",           conversao: 10.8 },
  { nome: "Cerimonialista",             conversao: 10.5 },
  { nome: "Buffet & Eventos",           conversao: 10.3 },
  { nome: "Coach & Mentoria",           conversao: 10.1 },
  { nome: "Agência de Marketing Digital", conversao: 9.8 },
  { nome: "Pet Shop",                   conversao:  9.5 },
  { nome: "Padaria & Confeitaria",      conversao:  9.3 },
  { nome: "Hamburgueria",               conversao:  9.1 },
  { nome: "Escola de Idiomas",          conversao:  9.2 },
  { nome: "Escola de Natação",          conversao:  9.0 },
  { nome: "Escola de Música",           conversao:  8.8 },
  { nome: "Escola de Dança",            conversao:  8.7 },
  { nome: "Eletricista",                conversao:  8.5 },
  { nome: "Lava Jato",                  conversao:  8.3 },
  { nome: "Autoescola",                 conversao:  8.1 },
];

/** Lookup por nome (case-insensitive) */
export function getConversao(nicho: string): number | null {
  const key = nicho.toLowerCase().trim();
  return (
    NICHOS.find(n => n.nome.toLowerCase() === key)?.conversao ?? null
  );
}

/** Cor do badge de conversão baseada na taxa */
export function conversaoBadgeColor(taxa: number): string {
  if (taxa >= 14) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  if (taxa >= 11) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  return "text-blue-400 bg-blue-400/10 border-blue-400/20";
}
