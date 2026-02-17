"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCartFromStorage,
  setCartToStorage,
  getWishlistFromStorage,
  setWishlistToStorage,
  type CartLineItem,
  type WishlistItem,
} from "@/lib/cart-wishlist-storage";

type CartWishlistContextType = {
  cart: CartLineItem[];
  addToCart: (productId: string, quantity?: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  /** Distinct product IDs present in the wishlist (used for counts and querying). */
  wishlistIds: string[];
  /** Raw wishlist entries including variant information. */
  wishlist: WishlistItem[];
  addToWishlist: (productId: string, variantId?: string) => void;
  removeFromWishlist: (productId: string, variantId?: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  toggleWishlist: (productId: string, variantId?: string) => void;
};

const CartWishlistContext = createContext<CartWishlistContextType | null>(null);

export function CartWishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(getCartFromStorage());
    setWishlist(getWishlistFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCartToStorage(cart);
  }, [cart, mounted]);

  useEffect(() => {
    if (!mounted) return;
    setWishlistToStorage(wishlist);
  }, [wishlist, mounted]);

  const wishlistIds = useMemo(
    () => Array.from(new Set(wishlist.map((x) => x.productId))),
    [wishlist],
  );

  const addToCart = useCallback(
    (productId: string, quantity = 1, variantId?: string) => {
      setCart((prev) => {
        const key = variantId ? `${productId}:${variantId}` : productId;
        const existing = prev.find(
          (x) =>
            (variantId ? `${x.productId}:${x.variantId}` : x.productId) === key,
        );
        if (existing) {
          return prev.map((x) =>
            (variantId ? `${x.productId}:${x.variantId}` : x.productId) === key
              ? { ...x, quantity: x.quantity + quantity }
              : x,
          );
        }
        return [...prev, { productId, quantity, variantId }];
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string, variantId?: string) => {
      setCart((prev) =>
        prev.filter((x) => {
          const key = x.variantId
            ? `${x.productId}:${x.variantId}`
            : x.productId;
          const target = variantId ? `${productId}:${variantId}` : productId;
          return key !== target;
        }),
      );
    },
    [],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      if (quantity < 1) {
        removeFromCart(productId, variantId);
        return;
      }
      setCart((prev) =>
        prev.map((x) => {
          const key = x.variantId
            ? `${x.productId}:${x.variantId}`
            : x.productId;
          const target = variantId ? `${productId}:${variantId}` : productId;
          return key === target ? { ...x, quantity } : x;
        }),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const addToWishlist = useCallback((productId: string, variantId?: string) => {
    setWishlist((prev) => {
      const exists = prev.some(
        (item) => item.productId === productId && item.variantId === variantId,
      );
      if (exists) return prev;
      return [...prev, { productId, variantId }];
    });
  }, []);

  const removeFromWishlist = useCallback(
    (productId: string, variantId?: string) => {
      setWishlist((prev) =>
        prev.filter((item) => {
          if (variantId) {
            // Remove only this specific variant entry.
            return !(item.variantId === variantId);
          }
          // Remove all wishlist entries for this product.
          return item.productId !== productId;
        }),
      );
    },
    [],
  );

  const clearWishlist = useCallback(() => setWishlist([]), []);

  const isInWishlist = useCallback(
    (productId: string, variantId?: string) => {
      if (variantId) {
        return wishlist.some(
          (item) =>
            item.productId === productId && item.variantId === variantId,
        );
      }
      return wishlist.some((item) => item.productId === productId);
    },
    [wishlist],
  );

  const toggleWishlist = useCallback(
    (productId: string, variantId?: string) => {
      setWishlist((prev) => {
        const exists = prev.some(
          (item) =>
            item.productId === productId && item.variantId === variantId,
        );
        if (exists) {
          // Toggle off this specific (product, variant) pair.
          return prev.filter(
            (item) =>
              !(item.productId === productId && item.variantId === variantId),
          );
        }
        // Add this (product, variant) to the wishlist.
        return [...prev, { productId, variantId }];
      });
    },
    [],
  );

  return (
    <CartWishlistContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlistIds,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
}

export function useCartWishlist() {
  const ctx = useContext(CartWishlistContext);
  if (!ctx) {
    throw new Error("useCartWishlist must be used within CartWishlistProvider");
  }
  return ctx;
}
