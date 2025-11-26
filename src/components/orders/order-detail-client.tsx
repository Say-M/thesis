"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navigation } from "@/components/navigation";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { Order, mockUser, trackingTemplate } from "@/data/mock-content";

type Props = {
  order: Order;
};

export function OrderDetailClient({ order }: Props) {
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Header order={order} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <OrderSummary order={order} />
            <TrackingCard />
            <InvoiceCard order={order} />
          </div>
          <div className="space-y-6">
            <ShippingCard />
            <SupportCard />
          </div>
        </div>
      </main>
    </>
  );
}

function Header({ order }: { order: Order }) {
  return (
    <header className="mb-8 space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/profile" className="hover:text-foreground">
          Profile
        </Link>
        <span>/</span>
        <span>Order {order.id}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Order {order.id}</h1>
        <Badge variant="outline" className="capitalize">
          {order.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Placed on {new Date(order.date).toLocaleDateString()}
      </p>
    </header>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-muted-foreground">Qty {item.quantity}</p>
            </div>
            <p>{item.price}</p>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{order.total}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <TrackingTimeline steps={trackingTemplate} />
      </CardContent>
    </Card>
  );
}

function InvoiceCard({ order }: { order: Order }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 500);
  };

  return (
    <Card className={isPrinting ? "print:border-none" : ""}>
      <CardHeader>
        <CardTitle>Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold">Billed to</p>
          <p className="text-sm text-muted-foreground">{mockUser.name}</p>
          <p className="text-sm text-muted-foreground">{mockUser.address}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Order ID</span>
          <span className="font-mono">{order.id}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Status</span>
          <Badge variant="secondary" className="capitalize">
            {order.status}
          </Badge>
        </div>
        <Separator />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handlePrint}>
            Print invoice
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/agent">Ask AI about this order</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ShippingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{mockUser.name}</p>
        <p>{mockUser.address}</p>
        <p>{mockUser.phone}</p>
      </CardContent>
    </Card>
  );
}

function SupportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need help?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Reach our concierge team if you need to escalate an order.
        </p>
        <Button variant="outline" className="w-full">
          Chat with support
        </Button>
        <Button className="w-full">Open a ticket</Button>
      </CardContent>
    </Card>
  );
}
