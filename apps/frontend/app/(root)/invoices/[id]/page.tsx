"use client";

import { useConfigContext } from "@/contexts/config";
import { useGetInvoice } from "@/hooks/api/invoices";
import type { InvoiceDetail } from "@/hooks/api/invoices";
import { Loader2Icon, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
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
  const sitePhone = config?.sitePhone?.trim() || null;
  const siteLogo = config?.siteLogo;

  const recipient = invoice.shippingAddress ?? invoice.customer;
  const recipientName =
    (recipient && "name" in recipient && recipient.name) ||
    invoice.customer?.name ||
    "—";
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
    shipping && [shipping.address, shipping.city].filter(Boolean).join(", ");

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

        {/* Invoice card */}
        <article className="overflow-hidden bg-white text-black shadow-lg print:shadow-none print:rounded-none max-w-4xl mx-auto font-sans">
          <div className="p-8 sm:p-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start pt-2 border-b border-gray-100 pb-8 mb-8 gap-4">
              <div className="flex-1">
                {siteLogo?.path ? (
                  <Image
                    src={siteLogo.path}
                    alt={siteName ?? "Company logo"}
                    height={180}
                    width={62}
                    className="object-contain h-16 w-auto"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-blue-600 uppercase">
                    {siteName || "DESIGNER BOOK"}
                  </h2>
                )}
              </div>
              <div className="flex-1 text-center flex flex-col items-center justify-center pt-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {siteName || "Designer Book"}
                </h2>
                {sitePhone && (
                  <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Phone className="size-3.5" /> {sitePhone}
                  </p>
                )}
              </div>
              <div className="flex-1 text-center sm:text-right flex flex-col sm:justify-center pt-2">
                <h1 className="text-xl font-bold text-gray-900">Quotation</h1>
              </div>
            </div>

            {/* Billing Info */}
            <div className="flex justify-between items-start mb-8 text-sm">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">To,</p>
                <p className="font-bold text-gray-900">{recipientName}</p>
                {shippingAddressLine && (
                  <p className="text-gray-700">{shippingAddressLine}</p>
                )}
                {!shippingAddressLine && recipientPhone && (
                  <p className="text-gray-700">{recipientPhone}</p>
                )}
                {!shippingAddressLine && !recipientPhone && recipientEmail && (
                  <p className="text-gray-700">{recipientEmail}</p>
                )}
              </div>
              <div className="text-right space-y-1">
                <p>
                  <span className="font-bold text-gray-900">Quotation#</span>{" "}
                  <span className="text-gray-700 ml-3">
                    {invoice.invoiceNumber ?? invoice._id}
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-900">Date:</span>{" "}
                  <span className="text-gray-700 ml-3">
                    {format(new Date(invoice.createdAt), "dd-MM-yyyy")}
                  </span>
                </p>
              </div>
            </div>

            {/* Greeting */}
            <div className="mb-6 text-sm text-gray-800 space-y-2">
              <p>Dear Sir/Mam,</p>
              <p>
                Thank you for your valuable inquiry. We are pleased to quote as
                below:
              </p>
            </div>

            {/* Table */}
            <div className="w-full mb-8">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-y-2 border-gray-200">
                    <th className="py-3 px-2 font-bold w-12 text-center text-gray-900">
                      #
                    </th>
                    <th className="py-3 px-2 font-bold uppercase text-gray-900">
                      Description
                    </th>
                    <th className="py-3 px-2 font-bold text-center uppercase text-gray-900 w-24">
                      Qty
                    </th>
                    <th className="py-3 px-2 font-bold text-right uppercase text-gray-900 w-32">
                      Price
                    </th>
                    <th className="py-3 px-2 font-bold text-right uppercase text-gray-900 w-32">
                      Discount
                    </th>
                    <th className="py-3 px-2 font-bold text-right uppercase text-gray-900 w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-center text-gray-700">
                        {i + 1}
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-gray-900">
                          {item.name}
                        </span>
                        {item.variantLabel && (
                          <span className="ml-1 text-gray-500 font-normal">
                            ({item.variantLabel})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-700">
                        <div>{item.quantity}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {"unit" in item &&
                          typeof (item as any).unit === "string" &&
                          (item as any).unit
                            ? (item as any).unit
                            : "pcs"}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700">
                        {formatMoney(item.unitPrice, currency)}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700">
                        {(item.discountAmount ?? 0) > 0
                          ? formatMoney(item.discountAmount ?? 0, currency)
                          : "—"}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700">
                        {formatMoney(item.total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-full sm:w-[50%] border-t-2 border-b-2 border-gray-200 py-3 flex flex-col gap-2 font-bold text-sm text-gray-900">
                {(invoice.shippingAmount ?? 0) > 0 && (
                  <div className="flex justify-between font-normal text-gray-700">
                    <span>Shipping</span>
                    <span>
                      {formatMoney(invoice.shippingAmount ?? 0, currency)}
                    </span>
                  </div>
                )}
                {(invoice.couponDiscountAmount ?? 0) > 0 && (
                  <div className="flex justify-between font-normal text-gray-700">
                    <span>Discount ({invoice?.coupon?.code})</span>
                    <span className="text-red-600">
                      -
                      {formatMoney(invoice.couponDiscountAmount ?? 0, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="uppercase">Grand Total</span>
                  <span>{formatMoney(invoice.total ?? 0, currency)}</span>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="text-sm text-gray-800 mb-16">
              <p>
                We hope you find our offer to be in line with your requirement.
              </p>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end mt-16 text-sm text-gray-900">
              <div className="text-center flex flex-col items-center">
                <p className="font-bold mb-10">
                  For, {siteName?.toUpperCase() || "DESIGNER BOOK"}
                </p>
                <div className="w-48 border-b border-gray-400 mb-2 relative flex justify-center h-12">
                  <svg
                    viewBox="0 0 200 60"
                    className="h-10 opacity-30 text-gray-800 absolute bottom-1"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M10,40 C30,10 50,50 70,30 C90,10 110,60 130,20 C150,0 170,50 190,30"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs uppercase text-gray-600 font-medium tracking-wider">
                  Authorized Signature
                </p>
              </div>
            </div>

            {/* Payment / status note - only screen */}
            <div className="mt-10 print:hidden text-muted-foreground text-sm">
              {invoice?.notes && <p>{invoice.notes}</p>}
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
