"use client";

import { useGetInvoice } from "@/hooks/api/invoices";
import type { InvoiceDetail } from "@/hooks/api/invoices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format-currency-base";
import {
  CheckCircle2,
  Loader2Icon,
  Package,
  RotateCcw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ORDER_STEPS = [
  { key: "Pending", label: "Order placed" },
  { key: "Processing", label: "Processing" },
  { key: "Shipped", label: "Shipped" },
  { key: "Delivered", label: "Delivered" },
];

const TERMINAL_STATUSES = ["Cancelled", "Refunded"];
const isTerminalStatus = (status: string) => TERMINAL_STATUSES.includes(status);

function OrderStatusStepper({ status }: { status: string }) {
  const currentIndex = ORDER_STEPS.findIndex(
    (s) => s.key.toLowerCase() === status.toLowerCase(),
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="relative flex items-start justify-between">
      {/* Progress line behind steps */}
      <div
        className="absolute left-0 right-0 top-[18px] h-0.5 bg-muted"
        aria-hidden
      />
      <div
        className="absolute left-0 top-[18px] h-0.5 bg-primary transition-all duration-300"
        style={{
          width: `${(activeIndex / (ORDER_STEPS.length - 1)) * 100}%`,
        }}
        aria-hidden
      />
      {ORDER_STEPS.map((step, i) => {
        const isCompleted = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <div
            key={step.key}
            className="relative z-10 flex flex-1 flex-col items-center"
          >
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                isCompleted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-background text-muted-foreground"
              } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span
              className={`mt-1.5 text-center text-xs font-medium ${
                isCompleted ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderStatusCancelled() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-destructive">
        <XCircle className="size-5" />
      </div>
      <div>
        <p className="font-medium text-destructive">Order cancelled</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          This order was cancelled and will not be fulfilled.
        </p>
      </div>
    </div>
  );
}

function OrderStatusRefunded() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-primary/50 bg-primary/10 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        <RotateCcw className="size-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">Order refunded</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          This order was refunded. Payment has been or will be returned.
        </p>
      </div>
    </div>
  );
}

function TrackResult({
  invoice,
  onTrackAnother,
}: {
  invoice: InvoiceDetail;
  onTrackAnother: () => void;
}) {
  const currency = invoice.currency ?? "BDT";
  const itemCount = invoice.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const status = invoice.status ?? "Pending";
  const showStepper = !isTerminalStatus(status);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Order found</h2>
              {status === "Cancelled" && (
                <Badge variant="destructive" className="font-normal">
                  Cancelled
                </Badge>
              )}
              {status === "Refunded" && (
                <Badge variant="secondary" className="font-normal">
                  Refunded
                </Badge>
              )}
            </div>
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">
              {invoice.invoiceNumber ?? invoice._id}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onTrackAnother}>
            Track another
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Order status
          </p>
          <div className="mt-4">
            {status === "Cancelled" && <OrderStatusCancelled />}
            {status === "Refunded" && <OrderStatusRefunded />}
            {showStepper && (
              <div className="relative">
                <OrderStatusStepper status={status} />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Package className="size-3.5" />
              Summary
            </p>
            <p className="mt-2 text-sm text-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
              {formatCurrency(Number(invoice.total ?? 0), { currency })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Truck className="size-3.5" />
              Payment
            </p>
            <div className="mt-2">
              {invoice.isFullyPaid ? (
                <Badge variant="secondary" className="font-normal">
                  Paid
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  {invoice.paymentPercentage != null &&
                  invoice.paymentPercentage > 0
                    ? `Partial (${Math.round(invoice.paymentPercentage)}%)`
                    : "Unpaid"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href={`/invoices/${invoice.invoiceNumber ?? invoice._id}`}>
            View full invoice
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function TrackOrderPage() {
  const [input, setInput] = useState("");
  const [searchId, setSearchId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetInvoice(searchId);
  const invoice = data?.data?.invoice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) setSearchId(trimmed);
  };

  const trackAnother = () => {
    setSearchId(null);
    setInput("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order or invoice number to see status and details.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="order-number" className="sr-only">
                Order or invoice number
              </Label>
              <Input
                id="order-number"
                type="text"
                placeholder="e.g. INV-20260214-00001"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 shrink-0 sm:w-auto"
            >
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="size-4 sm:mr-2" />
                  Track
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchId && (
        <>
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && isError && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-medium text-foreground">Order not found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check the number and try again, or contact support.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={trackAnother}
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && invoice && (
            <TrackResult
              invoice={data.data.invoice}
              onTrackAnother={trackAnother}
            />
          )}
        </>
      )}

      {!searchId && (
        <p className="text-center text-sm text-muted-foreground">
          Enter your order number above to get started.
        </p>
      )}
    </div>
  );
}
