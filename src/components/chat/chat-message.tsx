"use client";

import { AgentMessage } from "@/context/agent-context";
import { ProductCard } from "@/components/product-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  message: AgentMessage;
};

export function ChatMessage({ message }: Props) {
  const alignment =
    message.role === "user" ? "items-end text-right" : "items-start text-left";
  const bubbleStyles =
    message.role === "user"
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-foreground";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      <Badge variant={message.role === "user" ? "default" : "secondary"}>
        {message.role === "user" ? "You" : "Commerce Copilot"}
      </Badge>
      {renderContent(message, bubbleStyles)}
    </div>
  );
}

function renderContent(message: AgentMessage, bubbleStyles: string) {
  switch (message.type) {
    case "products":
      return (
        <div className="w-full space-y-3">
          <p className={`rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}>
            {message.content}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {message.products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      );
    case "comparison":
      return (
        <div className="w-full space-y-3">
          <p className={`rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}>
            {message.content}
          </p>
          <ComparisonTable message={message} />
        </div>
      );
    case "summary":
      return (
        <p
          className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}
        >
          {message.content}
        </p>
      );
    case "tracking":
      return (
        <div className="w-full space-y-3">
          <p className={`rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}>
            {message.content}
          </p>
          {message.tracking && <TrackingTimeline steps={message.tracking} />}
        </div>
      );
    case "checkout":
      return (
        <div className="w-full space-y-3">
          <p className={`rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}>
            {message.content}
          </p>
          {message.checkout && (
            <CheckoutPrompt
              total={message.checkout.total}
              itemCount={message.checkout.itemCount}
            />
          )}
        </div>
      );
    default:
      return (
        <p
          className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${bubbleStyles}`}
        >
          {message.content}
        </p>
      );
  }
}

function ComparisonTable({ message }: { message: AgentMessage }) {
  if (!message.comparison?.length) return null;

  const attributes: Array<keyof (typeof message.comparison)[number]> = [
    "price",
    "rating",
    "storage",
    "battery",
  ];

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Storage</TableHead>
            <TableHead>Battery</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {message.comparison.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-semibold capitalize">
                {row.name}
              </TableCell>
              {attributes.map((attr) => (
                <TableCell key={`${row.name}-${attr}`}>{row[attr]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CheckoutPrompt({
  total,
  itemCount,
}: {
  total: string;
  itemCount: number;
}) {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div>
        <p className="text-sm text-muted-foreground">Cart summary</p>
        <p className="text-2xl font-semibold">{total}</p>
        <p className="text-sm text-muted-foreground">
          {itemCount} item{itemCount > 1 ? "s" : ""} ready for checkout.
        </p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <Button asChild className="flex-1">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/cart">Review Cart</Link>
        </Button>
      </div>
    </div>
  );
}
