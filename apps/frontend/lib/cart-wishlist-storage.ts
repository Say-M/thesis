const CART_KEY = "designbook_cart";
const WISHLIST_KEY = "designbook_wishlist";

export type CartLineItem = {
  productId: string;
  quantity: number;
  variantId?: string;
};

export type WishlistItem = {
  productId: string;
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

export function getWishlistFromStorage(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    // Backward-compatible: previously wishlist was stored as string[] of productIds.
    if (parsed.every((x) => typeof x === "string")) {
      return (parsed as string[]).map((productId) => ({ productId }));
    }

    // New format: array of WishlistItem objects.
    return parsed.filter(
      (x): x is WishlistItem =>
        x &&
        typeof x === "object" &&
        typeof (x as WishlistItem).productId === "string",
    );
  } catch {
    return [];
  }
}

export function setWishlistToStorage(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
