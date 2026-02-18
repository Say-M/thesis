"use client";

import { useConfigContext } from "@/contexts/config";
import { useGetInvoice } from "@/hooks/api/invoices";
import type { InvoiceDetail } from "@/hooks/api/invoices";
import { Loader2Icon, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContext } from "react";
import { AuthContext } from "@/contexts/auth";

function formatMoney(amount: number, currency: string = "BDT"): string {
  return `${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function InvoiceContent({ invoice }: { invoice: InvoiceDetail }) {
  const { config } = useConfigContext();
  const { user } = useContext(AuthContext);
  const currency = invoice.currency ?? "BDT";

  const siteName = config?.siteName?.trim() || null;
  const siteAddress = config?.siteAddress?.trim() || null;
  const siteEmail = config?.siteEmail?.trim() || null;
  const sitePhone = config?.sitePhone?.trim() || null;
  const siteLogo = config?.siteLogo;
  const hasCompanyInfo =
    siteName || siteAddress || siteEmail || sitePhone || siteLogo;

  const recipient = invoice.billingAddress ?? invoice.customer;
  const recipientName =
    (recipient && "name" in recipient && recipient.name) ||
    invoice.customer?.name ||
    "—";
  const recipientAddress =
    recipient && "address" in recipient
      ? [
          recipient.address,
          recipient.city,
          recipient.state,
          recipient.postalCode,
        ]
          .filter(Boolean)
          .join(", ")
      : "";
  const recipientEmail =
    (recipient && "email" in recipient && recipient.email) ||
    invoice.customer?.email ||
    "";
  const recipientPhone =
    (recipient && "phone" in recipient && recipient.phone) ||
    invoice.customer?.phone ||
    "";

  const shipping = invoice.shippingAddress;
  const shippingAddressLine =
    shipping &&
    [shipping.address, shipping.city, shipping.state, shipping.postalCode]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="min-h-screen bg-muted/50 py-8 px-4 sm:px-6 print:bg-white print:py-0 print:px-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        {/* Print / back link - hidden when printing */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          {user ? (
            <Link
              href="/profile"
              className="text-sm font-medium text-primary hover:text-primary/90 hover:underline"
            >
              ← Back to profile
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="text-sm font-medium text-primary hover:text-primary/90 hover:underline"
          >
            Print invoice
          </button>
        </div>

        {/* Invoice card - only this is visible when printing */}
        <article className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg print:shadow-none print:rounded-none">
          <div className="p-8 sm:p-10">
            {/* Top: Company + Invoice title */}
            <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
              {hasCompanyInfo ? (
                <div>
                  {siteLogo?.path && (
                    <Image
                      src={siteLogo.path}
                      alt={siteName ?? "Company logo"}
                      height={48}
                      width={48}
                    />
                  )}
                  <div className="mt-4">
                    {siteName && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {siteName}
                      </p>
                    )}
                    {siteAddress ? (
                      <p
                        className={
                          siteName ? "mt-1 text-foreground" : "text-foreground"
                        }
                      >
                        {siteAddress}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                      {siteEmail ? (
                        <span className="flex items-center gap-2">
                          <Mail className="size-3.5 shrink-0" />
                          {siteEmail}
                        </span>
                      ) : null}
                      {sitePhone ? (
                        <span className="flex items-center gap-2">
                          <Phone className="size-3.5 shrink-0" />
                          {sitePhone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
              <div
                className={`text-left sm:text-right ${!hasCompanyInfo ? "sm:ml-0" : ""}`}
              >
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Invoice
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.invoiceNumber ?? invoice._id}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {format(new Date(invoice.createdAt), "PP hh:mm aa")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground print:hidden">
                  Payment Status: {invoice.isFullyPaid ? "Paid" : "Pending"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground print:hidden">
                  Shipping Status: {invoice.status}
                </p>
              </div>
            </div>
            <Separator className="my-8" />
            {/* Recipient & Shipping */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bill to
                </p>
                <p className="font-medium text-foreground">{recipientName}</p>
                {recipientAddress && (
                  <p className="text-sm text-muted-foreground">
                    {recipientAddress}
                  </p>
                )}
                {recipientEmail && (
                  <a
                    href={`mailto:${recipientEmail}`}
                    className="text-sm text-muted-foreground flex items-center gap-1.5"
                  >
                    <Mail className="size-3 shrink-0" />
                    {recipientEmail}
                  </a>
                )}
                {recipientPhone && (
                  <a
                    href={`tel:${recipientPhone}`}
                    className="text-sm text-muted-foreground flex items-center gap-1.5"
                  >
                    <Phone className="size-3 shrink-0" />
                    {recipientPhone}
                  </a>
                )}
              </div>

              {shipping && (
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ship to ({invoice.status})
                  </p>
                  <p className="font-medium text-foreground">{shipping.name}</p>
                  {shippingAddressLine && (
                    <p className="text-sm text-muted-foreground">
                      {shippingAddressLine}
                    </p>
                  )}
                  {shipping.email && (
                    <a
                      href={`mailto:${shipping.email}`}
                      className="text-sm text-muted-foreground flex items-center gap-1.5"
                    >
                      <Mail className="size-3 shrink-0" />
                      {shipping.email}
                    </a>
                  )}
                  {shipping.phone && (
                    <a
                      href={`tel:${shipping.phone}`}
                      className="text-sm text-muted-foreground flex items-center gap-1.5"
                    >
                      <Phone className="size-3 shrink-0" />
                      {shipping.phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="mt-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="font-medium pl-0">
                      Description
                    </TableHead>
                    <TableHead className="w-20 text-right font-medium">
                      Qty
                    </TableHead>
                    <TableHead className="w-28 text-right font-medium">
                      Rate
                    </TableHead>
                    <TableHead className="w-24 text-right font-medium">
                      Discount
                    </TableHead>
                    <TableHead className="w-32 text-right font-medium">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item, i) => (
                    <TableRow
                      key={i}
                      className="border-b border-border text-foreground"
                    >
                      <TableCell className="pl-0">
                        <span className="font-medium">{item.name}</span>
                        {item.variantLabel && (
                          <span className="ml-1 text-muted-foreground">
                            ({item.variantLabel})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(item.unitPrice, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.discountAmount ?? 0) > 0
                          ? formatMoney(item.discountAmount ?? 0, currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(item.total, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-background">
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground pl-0"
                    >
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatMoney(invoice.subtotal ?? 0, currency)}
                    </TableCell>
                  </TableRow>
                  {(invoice.couponDiscountAmount ?? 0) > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground pl-0"
                      >
                        Discount ({invoice?.coupon?.code})
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -
                        {formatMoney(
                          invoice.couponDiscountAmount ?? 0,
                          currency,
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {(invoice.shippingAmount ?? 0) > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground pl-0"
                      >
                        Shipping
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMoney(invoice.shippingAmount ?? 0, currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* {(invoice.taxAmount ?? 0) > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground pl-0"
                      >
                        Tax
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMoney(invoice.taxAmount ?? 0, currency)}
                      </TableCell>
                    </TableRow>
                  )} */}
                  {(invoice.codAmount ?? 0) > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground pl-0"
                      >
                        Cash on delivery
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMoney(invoice.codAmount ?? 0, currency)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="border-t border-border text-base font-semibold text-primary pl-0"
                    >
                      Total
                    </TableCell>
                    <TableCell className="border-t border-border text-right text-base font-semibold text-primary">
                      {formatMoney(invoice.total ?? 0, currency)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Payment / status note */}
            <div className="mt-10 print:hidden">
              {invoice?.notes && <p>{invoice.notes}</p>}
              {/* <p className="text-xs text-muted-foreground">
                Status:{" "}
                <span className="font-medium capitalize text-foreground">
                  {invoice.status}
                </span>
                {invoice.isFullyPaid && (
                  <span className="ml-2 text-primary">(Paid)</span>
                )}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Transfer the amount to the business account below. Please
                include the invoice number on your payment.
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">
                Bank: — &nbsp; IBAN: —
              </p> */}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function InvoiceViewPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { data, isLoading, isError } = useGetInvoice(id);
  const { user } = useContext(AuthContext);

  if (!id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Invalid invoice ID.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link
          href={user ? "/profile" : "/"}
          className="text-sm font-medium text-primary hover:text-primary/90 hover:underline"
        >
          Back to {user ? "profile" : "home"}
        </Link>
      </div>
    );
  }

  return <InvoiceContent invoice={data.data.invoice} />;
}
