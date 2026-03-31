const VALID_BRAZIL_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

function looksLikeMissingMobileNine(digits: string): boolean {
  if (digits.length !== 10) return false;
  const firstLocalDigit = digits.slice(2, 3);
  return ["6", "7", "8", "9"].includes(firstLocalDigit);
}

export function normalizeBrazilianDigits(value: string | null | undefined): string | null {
  if (!value) return null;

  let digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (digits.length < 10 || digits.length > 11) return null;
  if (!VALID_BRAZIL_DDDS.has(digits.slice(0, 2))) return null;

  if (looksLikeMissingMobileNine(digits)) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }

  return digits;
}

export function buildCanonicalWhatsappUrl(value: string | null | undefined, text?: string): string | null {
  const digits = normalizeBrazilianDigits(value);
  if (!digits) return null;

  const baseUrl = `https://wa.me/55${digits}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}

export function formatBrazilianContact(value: string | null | undefined): string | null {
  const digits = normalizeBrazilianDigits(value);
  if (!digits) return null;

  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}
