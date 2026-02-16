const country = process.env.NEXT_PUBLIC_COUNTRY ?? "en-US";
const defaultCurrency = process.env.NEXT_PUBLIC_CURRENCY ?? "BDT";

export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions & { currency?: string } = {},
): string {
  const { currency = defaultCurrency, ...rest } = options;
  return new Intl.NumberFormat(country, {
    currency,
    ...rest,
    style: "currency",
  }).format(value);
}
