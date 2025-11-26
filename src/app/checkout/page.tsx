"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgent } from "@/context/agent-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Navigation } from "@/components/navigation";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatPrice, getEffectivePrice } from "@/lib/pricing";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, user, clearCart } = useAgent();
  const [paymentMethod, setPaymentMethod] = useState("card");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearCart();
    router.push("/checkout/confirmation");
  };

  if (cart.length === 0) {
    return (
      <>
        <Navigation />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                Your cart is empty. Add items to proceed.
              </p>
              <Button asChild>
                <Link href="/">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <h1 className="text-4xl font-semibold">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order with secure checkout.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      defaultValue={user.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      defaultValue={user.email}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      defaultValue={user.phone}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Main Street, City, State 12345"
                      rows={4}
                      defaultValue={user.address}
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Payment Method</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="cursor-pointer">
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="cursor-pointer">
                          PayPal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="cursor-pointer">
                          Cash on Delivery
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" required />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full">
                    Complete Order
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.title} x{item.quantity}
                      </span>
                      <span>
                        {formatPrice(getEffectivePrice(item) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
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
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{cartTotal}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
