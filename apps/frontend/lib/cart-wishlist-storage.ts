const CART_KEY = "designbook_cart";
const WISHLIST_KEY = "designbook_wishlist";

export type CartLineItem = {
  productId: string;
  quantity: number;
  variantId?: string;
};

export function getCartFromStorage(): CartLineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLineItem =>
        x &&
        typeof x === "object" &&
        typeof (x as CartLineItem).productId === "string" &&
        typeof (x as CartLineItem).quantity === "number" &&
        (x as CartLineItem).quantity >= 1,
    );
  } catch {
    return [];
  }
}

export function setCartToStorage(items: CartLineItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function getWishlistFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function setWishlistToStorage(productIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(productIds));
  } catch {
    // ignore
  }
}
