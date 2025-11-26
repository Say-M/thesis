"use client";

import Link from "next/link";
import { useAgent } from "@/context/agent-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import { getEffectivePrice, getPriceDisplay, formatPrice } from "@/lib/pricing";

export default function CartPage() {
  const { cart, cartTotal, updateCartQuantity, removeFromCart } = useAgent();

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <h1 className="text-4xl font-semibold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            Review your items and proceed to checkout.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="mb-4">Your cart is empty.</p>
                  <Button asChild>
                    <Link href="/">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              cart.map((item) => {
                const unitPrice = getEffectivePrice(item);
                const itemTotal = unitPrice * item.quantity;
                const displayPrice = getPriceDisplay(item);

                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                          <span className="text-xs text-muted-foreground">
                            Image
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.category}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateCartQuantity(
                                    item.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-16 text-center"
                                min={1}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              {displayPrice.previous && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {displayPrice.previous} ea
                                </p>
                              )}
                              <p className="font-semibold">
                                {formatPrice(itemTotal)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ({displayPrice.current} ea)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {cart.map((item) => {
                    const lineTotal = formatPrice(
                      getEffectivePrice(item) * item.quantity
                    );
                    return (
                      <div
                        key={`${item.id}-summary`}
                        className="flex justify-between"
                      >
                        <span className="text-muted-foreground">
                          {item.title} x{item.quantity}
                        </span>
                        <span>{lineTotal}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{cartTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{cartTotal}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                  disabled={!cart.length}
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
