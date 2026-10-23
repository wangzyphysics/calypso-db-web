/** Display formatting only; units and validation status are supplied by the record. */
export function formatDetailValue(value: unknown): string {
  return value == null || value === ""
    ? "Not reported"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
}
export function formatDetailNumber(value: number, digits = 4): string {
  if (
    value !== 0 &&
    (Math.abs(value) < 10 ** -digits || Math.abs(value) >= 1e7)
  )
    return value.toExponential(Math.min(digits, 6));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}
