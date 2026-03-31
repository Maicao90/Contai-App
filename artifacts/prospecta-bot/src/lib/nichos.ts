export interface NichoInfo {
  nome: string;
  conversao: number;
}

export const NICHOS: NichoInfo[] = [
  { nome: "Clinica Odontologica", conversao: 17.2 },
  { nome: "Dentista", conversao: 16.8 },
  { nome: "Implantodontia", conversao: 16.4 },
  { nome: "Ortodontia", conversao: 16.1 },
  { nome: "Harmonizacao Facial", conversao: 15.9 },
  { nome: "Clinica de Depilacao a Laser", conversao: 15.7 },
  { nome: "Cirurgiao Plastico", conversao: 15.6 },
  { nome: "Dermatologista", conversao: 15.5 },
  { nome: "Salao de Beleza", conversao: 15.4 },
  { nome: "Psicologo", conversao: 15.2 },
  { nome: "Terapeuta", conversao: 15.0 },
  { nome: "Nutricionista", conversao: 14.8 },
  { nome: "Barbearia", conversao: 14.7 },
  { nome: "Clinica Estetica", conversao: 14.5 },
  { nome: "Clinica de Emagrecimento", conversao: 14.4 },
  { nome: "Fotografo", conversao: 14.2 },
  { nome: "Clinica Medica", conversao: 13.8 },
  { nome: "Personal Trainer", conversao: 13.5 },
  { nome: "Clinica de Fisioterapia", conversao: 13.2 },
  { nome: "Quiropraxia", conversao: 13.1 },
  { nome: "Arquiteto", conversao: 13.0 },
  { nome: "Designer de Interiores", conversao: 12.9 },
  { nome: "Academia", conversao: 12.8 },
  { nome: "Crossfit", conversao: 12.7 },
  { nome: "Spa & Massagem", conversao: 12.6 },
  { nome: "Clinica Veterinaria", conversao: 12.3 },
  { nome: "Podologia", conversao: 12.2 },
  { nome: "Manicure & Nail Designer", conversao: 12.1 },
  { nome: "Advogado", conversao: 12.1 },
  { nome: "Escritorio de Advocacia", conversao: 12.0 },
  { nome: "Energia Solar", conversao: 11.9 },
  { nome: "Moveis Sob Medida", conversao: 11.8 },
  { nome: "Moveis Planejados", conversao: 11.7 },
  { nome: "Restaurante", conversao: 11.5 },
  { nome: "Pousada", conversao: 11.4 },
  { nome: "Hotel", conversao: 11.3 },
  { nome: "Clinica de Estetica Automotiva", conversao: 11.4 },
  { nome: "Contabilidade", conversao: 11.2 },
  { nome: "Imobiliaria", conversao: 10.9 },
  { nome: "Construtora", conversao: 10.9 },
  { nome: "Oficina Mecanica", conversao: 10.8 },
  { nome: "Funilaria e Pintura", conversao: 10.7 },
  { nome: "Cerimonialista", conversao: 10.5 },
  { nome: "Buffet & Eventos", conversao: 10.3 },
  { nome: "Coach & Mentoria", conversao: 10.1 },
  { nome: "Agencia de Marketing Digital", conversao: 9.8 },
  { nome: "Consultoria Empresarial", conversao: 9.7 },
  { nome: "Pet Shop", conversao: 9.5 },
  { nome: "Padaria & Confeitaria", conversao: 9.3 },
  { nome: "Escola de Idiomas", conversao: 9.2 },
  { nome: "Hamburgueria", conversao: 9.1 },
  { nome: "Escola de Natacao", conversao: 9.0 },
  { nome: "Escola de Musica", conversao: 8.8 },
  { nome: "Escola de Danca", conversao: 8.7 },
  { nome: "Eletricista", conversao: 8.5 },
  { nome: "Lava Jato", conversao: 8.3 },
  { nome: "Autoescola", conversao: 8.1 },
];

export function getConversao(nicho: string): number | null {
  const key = nicho.toLowerCase().trim();
  return NICHOS.find((item) => item.nome.toLowerCase() === key)?.conversao ?? null;
}

export function conversaoBadgeColor(taxa: number): string {
  if (taxa >= 14) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  if (taxa >= 11) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  return "text-blue-400 bg-blue-400/10 border-blue-400/20";
}
