export function parseDecimal(input: string): number {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;
  return Number.parseFloat(normalized);
}

export function sanitizeDecimalInput(s: string): string | null {
  if (s === "") return "";
  return /^\d{0,4}([.,]\d{0,2})?$/.test(s) ? s : null;
}

export function sanitizeIntInput(s: string): string | null {
  if (s === "") return "";
  return /^\d{0,3}$/.test(s) ? s : null;
}
