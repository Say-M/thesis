"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { toast } from "sonner";

import {
  Product,
  ComparisonRow,
  TrackingStep,
  Order,
  User,
  getComparisonRows,
  getProductsForQuery,
  getReviewSummary,
  trackingTemplate,
  findProductByName,
  mockUser,
  mockOrders,
} from "@/data/mock-content";
import { getEffectivePrice, formatPrice } from "@/lib/pricing";

type MessageKind =
  | "text"
  | "products"
  | "comparison"
  | "summary"
  | "tracking"
  | "checkout";

type CheckoutSummary = {
  itemCount: number;
  total: string;
};

export type AgentMessage = {
  id: string;
  role: "user" | "agent";
  type: MessageKind;
  content: string;
  products?: Product[];
  comparison?: ComparisonRow[];
  tracking?: TrackingStep[];
  checkout?: CheckoutSummary;
};

export type CartItem = Product & {
  quantity: number;
};

type AgentContextValue = {
  messages: AgentMessage[];
  cart: CartItem[];
  orders: Order[];
  user: User;
  sendMessage: (input: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: string;
  cartItemCount: number;
};

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

const initialMessage: AgentMessage = {
  id: "welcome",
  role: "agent",
  type: "text",
  content:
    "Hey there! I'm your AI commerce co-pilot. Ask me for product ideas, comparisons, review summaries, or to track an order. You can also ask me to add products to your cart!",
};

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<AgentMessage[]>([initialMessage]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders] = useState<Order[]>(mockOrders);
  const [user] = useState<User>(mockUser);

  const sendMessage = useCallback(
    (input: string) => {
      if (!input.trim()) return;

      const userMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: "user",
        type: "text",
        content: input.trim(),
      };

      setMessages((prev) => {
        const withUser = [...prev, userMessage];
        const botReply = buildBotMessage(userMessage.content, setCart, cart);
        return botReply ? [...withUser, botReply] : withUser;
      });
    },
    [cart]
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    toast.success(`Added ${product.title} to cart`, {
      description: "Cart updated with your selection.",
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === productId);
      if (item) {
        toast.success(`Removed ${item.title} from cart`);
      }
      return prev.filter((item) => item.id !== productId);
    });
  }, []);

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(() => {
    const total = cart.reduce(
      (sum, item) => sum + getEffectivePrice(item) * item.quantity,
      0
    );

    return formatPrice(total);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      messages,
      cart,
      orders,
      user,
      sendMessage,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartItemCount,
    }),
    [
      messages,
      cart,
      orders,
      user,
      sendMessage,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartItemCount,
    ]
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}

function buildBotMessage(
  input: string,
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
  cartSnapshot: CartItem[]
): AgentMessage {
  const normalized = input.toLowerCase();

  // Handle "add to cart" requests
  if (
    normalized.includes("add") &&
    (normalized.includes("cart") || normalized.includes("to cart"))
  ) {
    const product = findProductByName(input);
    if (product) {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });

      return {
        id: crypto.randomUUID(),
        role: "agent",
        type: "text",
        content: `Great choice! I've added ${product.title} to your cart. You can view your cart anytime or continue shopping.`,
      };
    } else {
      return {
        id: crypto.randomUUID(),
        role: "agent",
        type: "text",
        content:
          "I couldn't find that product. Try asking me to show you products first, then I can add them to your cart!",
      };
    }
  }

  if (
    normalized.includes("show me") ||
    normalized.includes("find") ||
    normalized.includes("search") ||
    normalized.includes("recommend")
  ) {
    const products = getProductsForQuery(input);
    return {
      id: crypto.randomUUID(),
      role: "agent",
      type: "products",
      content: "Here are a few picks you might like:",
      products,
    };
  }

  if (normalized.includes("compare")) {
    const comparison = getComparisonRows(input);
    return {
      id: crypto.randomUUID(),
      role: "agent",
      type: "comparison",
      content: "Side-by-side specs for quick clarity:",
      comparison,
    };
  }

  if (normalized.startsWith("summarize")) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      type: "summary",
      content: getReviewSummary(input),
    };
  }

  if (normalized.includes("track order")) {
    return {
      id: crypto.randomUUID(),
      role: "agent",
      type: "tracking",
      content: "Here is the latest tracking timeline:",
      tracking: trackingTemplate,
    };
  }

  if (
    normalized.includes("checkout") ||
    normalized.includes("complete order") ||
    normalized.includes("purchase")
  ) {
    if (!cartSnapshot.length) {
      return {
        id: crypto.randomUUID(),
        role: "agent",
        type: "text",
        content:
          "Your cart is empty. Ask me to recommend products and I can add them before checkout.",
      };
    }

    const summary = getCartSummary(cartSnapshot);
    return {
      id: crypto.randomUUID(),
      role: "agent",
      type: "checkout",
      content: `You're ready to check out ${summary.itemCount} item${
        summary.itemCount > 1 ? "s" : ""
      }. Review everything or head straight to payment.`,
      checkout: summary,
    };
  }

  return {
    id: crypto.randomUUID(),
    role: "agent",
    type: "text",
    content:
      "I'm ready! Ask me to show products, compare items, summarize reviews, track an order, or add products to your cart.",
  };
}

function getCartSummary(cart: CartItem[]): CheckoutSummary {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cart.reduce(
    (sum, item) => sum + getEffectivePrice(item) * item.quantity,
    0
  );

  return {
    itemCount,
    total: formatPrice(totalValue),
  };
}
