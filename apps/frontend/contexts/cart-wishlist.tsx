"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getCartFromStorage,
  setCartToStorage,
  getWishlistFromStorage,
  setWishlistToStorage,
  type CartLineItem,
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
  wishlistIds: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
};

const CartWishlistContext = createContext<CartWishlistContextType | null>(null);

export function CartWishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(getCartFromStorage());
    setWishlistIds(getWishlistFromStorage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setCartToStorage(cart);
  }, [cart, mounted]);

  useEffect(() => {
    if (!mounted) return;
    setWishlistToStorage(wishlistIds);
  }, [wishlistIds, mounted]);

  const addToCart = useCallback(
    (productId: string, quantity = 1, variantId?: string) => {
      setCart((prev) => {
        const key = variantId ? `${productId}:${variantId}` : productId;
        const existing = prev.find(
          (x) => (variantId ? `${x.productId}:${x.variantId}` : x.productId) === key,
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
          const key = x.variantId ? `${x.productId}:${x.variantId}` : x.productId;
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
          const key = x.variantId ? `${x.productId}:${x.variantId}` : x.productId;
          const target = variantId ? `${productId}:${variantId}` : productId;
          return key === target ? { ...x, quantity } : x;
        }),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev : [...prev, productId],
    );
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearWishlist = useCallback(() => setWishlistIds([]), []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  return (
    <CartWishlistContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlistIds,
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
