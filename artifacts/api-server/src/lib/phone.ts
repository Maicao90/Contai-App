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
  const digits = normalizePhoneDigits(value);
  if (!digits) return [];

  const base = digits.startsWith("55") ? digits.slice(2) : digits;
  if (base.length < 10 || base.length > 11) {
    return Array.from(new Set([normalizeBrazilPhone(value), base].filter(Boolean)));
  }

  const ddd = base.slice(0, 2);
  const rest = base.length === 11 ? base.slice(3) : base.slice(2);

  // Variações: DDD + 8 dígitos, DDD + 9 dígitos, 55 + DDD + 8, 55 + DDD + 9
  const v8 = `${ddd}${rest}`;
  const v9 = `${ddd}9${rest}`;

  return Array.from(
    new Set([
      `55${v8}`,
      `55${v9}`,
      v8,
      v9,
      normalizeBrazilPhone(value),
      digits,
    ].filter(Boolean)),
  );
}
