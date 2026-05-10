export function parseDecimal(input: string): number {
  return Number.parseFloat(input.replace(",", "."));
}
