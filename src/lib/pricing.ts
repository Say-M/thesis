import { Product } from "@/data/mock-content";

export function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getEffectivePrice(product: Product): number {
  const base = parsePrice(product.price);
  const sale = parsePrice(product.salePrice);
  if (sale > 0) {
    return sale;
  }
  if (base === 0) {
    return 0;
  }
  // Apply a friendly 10% discount when no explicit sale price is provided.
  const discounted = Math.round(base * 0.9 * 100) / 100;
  return discounted;
}

export function getPriceDisplay(product: Product): {
  current: string;
  previous?: string;
  discountPercent?: number;
} {
  const current = getEffectivePrice(product);
  const original = parsePrice(product.price);

  if (original > current && original > 0) {
    const discountPercent = Math.round(((original - current) / original) * 100);
    return {
      current: formatPrice(current),
      previous: formatPrice(original),
      discountPercent,
    };
  }

  return {
    current: formatPrice(current || original),
  };
}
