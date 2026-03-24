export interface NichoInfo {
  nome: string;
  conversao: number; // percentual ex: 14.7 = 14.7%
}

/** Nichos ordenados por taxa de conversão (maior → menor) */
export const NICHOS: NichoInfo[] = [
  { nome: "Clínica Odontológica",   conversao: 17.2 },
  { nome: "Dentista",               conversao: 16.8 },
  { nome: "Salão de Beleza",        conversao: 15.4 },
  { nome: "Psicólogo",              conversao: 15.2 },
  { nome: "Terapeuta",              conversao: 15.0 },
  { nome: "Nutricionista",          conversao: 14.8 },
  { nome: "Barbearia",              conversao: 14.7 },
  { nome: "Clínica Estética",       conversao: 14.5 },
  { nome: "Fotógrafo",              conversao: 14.2 },
  { nome: "Personal Trainer",       conversao: 13.5 },
  { nome: "Clínica de Fisioterapia",conversao: 13.2 },
  { nome: "Arquiteto",              conversao: 13.0 },
  { nome: "Designer de Interiores", conversao: 12.9 },
  { nome: "Academia",               conversao: 12.8 },
  { nome: "Clínica Veterinária",    conversao: 12.3 },
  { nome: "Advogado",               conversao: 12.1 },
  { nome: "Restaurante",            conversao: 11.5 },
  { nome: "Oficina Mecânica",       conversao: 10.8 },
  { nome: "Cerimonialista",         conversao: 10.5 },
  { nome: "Pet Shop",               conversao:  9.5 },
  { nome: "Escola de Idiomas",      conversao:  9.2 },
  { nome: "Escola de Natação",      conversao:  9.0 },
  { nome: "Escola de Música",       conversao:  8.8 },
  { nome: "Escola de Dança",        conversao:  8.7 },
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
