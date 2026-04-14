import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, subDays } from "date-fns";

export const VALIDATORS = {
  currency: (input: string): number | null => {
    // Remove formatting
    const cleaned = input
      .trim()
      .replace(/[R$]/g, '')
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const num = parseFloat(cleaned);
    
    if (isNaN(num) || num <= 0) {
      return null;
    }
    
    return num;
  },

  paymentMethod: (input: string): string | null => {
    const normalized = input.toLowerCase().trim();
    
    const map: Record<string, string> = {
      'pix': 'pix',
      'debito': 'debito',
      'débito': 'debito',
      'credito': 'credito',
      'crédito': 'credito',
      'cartao': 'credito',
      'cartão': 'credito',
      'dinheiro': 'dinheiro',
      'boleto': 'boleto'
    };
    
    return map[normalized] || null;
  },

  text: (input: string): string | null => {
      const v = input.trim();
      if (v.toLowerCase() === "pular" || v.toLowerCase() === "não" || v.toLowerCase() === "nao") {
          return "";
      }
      return v || null;
  },

  category: async (input: string, householdId: number): Promise<string | null> => {
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.householdId, householdId));
    
    const inputNormalized = input.toLowerCase().trim();
    const match = categories.find(c => 
      c.name.toLowerCase().includes(inputNormalized) || inputNormalized.includes(c.name.toLowerCase())
    );
    
    if (match) return match.name;
    
    if (inputNormalized.length > 2) {
      return input.trim(); // Aceita a nova categoria
    }
    return null;
  },

  date: (input: string, timezone: string): Date | null => {
    const nowLocal = toZonedTime(new Date(), timezone || "America/Sao_Paulo");
    const normalized = input.trim().toLowerCase();
    
    if (/^hoje$/i.test(normalized)) {
      return fromZonedTime(nowLocal, timezone || "America/Sao_Paulo");
    }
    
    if (/^ontem$/i.test(normalized)) {
      return fromZonedTime(subDays(nowLocal, 1), timezone || "America/Sao_Paulo");
    }
    
    if (/^amanh[ãa]$/i.test(normalized)) {
      return fromZonedTime(addDays(nowLocal, 1), timezone || "America/Sao_Paulo");
    }
    
    return null;
  },

  boolean: (input: string): boolean | null => {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'sim' || normalized === 's' || normalized === 'yes' || normalized === 'y' || normalized === 'confirmar' || normalized === 'confirmo') {
      return true;
    }
    if (normalized === 'não' || normalized === 'nao' || normalized === 'n' || normalized === 'no' || normalized === 'cancelar') {
      return false;
    }
    return null;
  },
  
  fiscalContext: (input: string): string | null => {
    const normalized = input.toLowerCase().trim();
    if (normalized.includes('pessoal') || normalized.includes('meu') || normalized.includes('minha')) return 'personal';
    if (normalized.includes('empresa') || normalized.includes('pj') || normalized.includes('trabalho')) return 'business';
    if (normalized.includes('casa') || normalized.includes('familia') || normalized.includes('família') || normalized.includes('compartilhado')) return 'shared';
    return null;
  },

  accountType: (input: string): 'house' | 'personal' | null => {
    const normalized = input.toLowerCase().trim();
    if (
      normalized.includes('casa') ||
      normalized.includes('compartilhado') ||
      normalized.includes('compartilhada') ||
      normalized.includes('nosso') ||
      normalized.includes('nossa') ||
      normalized.includes('família') ||
      normalized.includes('familia')
    ) return 'house';
    if (
      normalized.includes('pessoal') ||
      normalized.includes('minha') ||
      normalized.includes('meu') ||
      normalized.includes('só minha') ||
      normalized.includes('so minha') ||
      normalized.includes('individual')
    ) return 'personal';
    return null;
  }
};
