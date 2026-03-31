export function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function normalizeBrazilPhone(value: string | null | undefined) {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return `55${digits}`;
  }

  return digits;
}

export function expandBrazilPhoneVariants(value: string | null | undefined) {
  const normalized = normalizeBrazilPhone(value);
  const local = normalized.startsWith("55") ? normalized.slice(2) : normalized;

  return Array.from(new Set([normalized, local].filter(Boolean)));
}
