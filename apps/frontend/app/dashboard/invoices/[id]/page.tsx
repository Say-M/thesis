"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt, Banknote, RotateCcw } from "lucide-react";
import { useGetInvoice } from "@/hooks/api/invoices";
import {
  useListTransactions,
  useUpdateTransaction,
  TransactionStatus,
} from "@/hooks/api/transactions";
import { useFormatCurrency } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus, TransactionType } from "@repo/common/enums/invoice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import AddTransactionDialog from "./add-transaction-dialog";

export default function InvoiceDetailPage() {
  const formatCurrency = useFormatCurrency();
  const params = useParams();
  const invoiceId = params.id as string;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const { data, isLoading } = useGetInvoice(invoiceId);
  const { data: transactionsData, isLoading: transactionsLoading } =
    useListTransactions(invoiceId);
  const { mutate: updateTransaction, isPending: isUpdatingTransaction } =
    useUpdateTransaction(invoiceId);

  const invoice = data?.data?.invoice;
  const transactions = transactionsData?.data?.transactions ?? [];
  const remainingBalance = invoice?.remainingBalance ?? invoice?.total ?? 0;
  const remainingRefundableBalance = Math.max(
    0,
    (invoice?.paidAmount || 0) - (invoice?.refundedAmount || 0),
  );
  const isCancelledOrRefunded =
    invoice?.status === InvoiceStatus.CANCELLED ||
    invoice?.status === InvoiceStatus.REFUNDED;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4">
        <p>Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Invoice Details</h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
        </div>
        <Badge
          variant={
            invoice.status === InvoiceStatus.DELIVERED
              ? "default"
              : invoice.status === InvoiceStatus.CANCELLED ||
                  invoice.status === InvoiceStatus.REFUNDED
                ? "destructive"
                : "secondary"
          }
          className="text-sm"
        >
          {invoice.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{invoice.customer?.name ?? "—"}</p>
            </div>
            {invoice.customer?.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{invoice.customer.email}</p>
              </div>
            )}
            {invoice.customer?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{invoice.customer.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge variant="outline">{invoice.type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {invoice.createdAt
                  ? format(new Date(invoice.createdAt), "PP hh:mm aa")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.billingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{invoice.billingAddress.name}</p>
              {invoice.billingAddress.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.billingAddress.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {invoice.billingAddress.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.billingAddress.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.billingAddress.city}, {invoice.billingAddress.state}{" "}
                {invoice.billingAddress.postalCode}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {invoice.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{invoice.shippingAddress.name}</p>
              {invoice.shippingAddress.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.shippingAddress.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {invoice.shippingAddress.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.shippingAddress.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.shippingAddress.city}, {invoice.shippingAddress.state}{" "}
                {invoice.shippingAddress.postalCode}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[120px] text-right">
                  Unit Price
                </TableHead>
                <TableHead className="w-[120px] text-right">Discount</TableHead>
                <TableHead className="w-[120px] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-sm text-muted-foreground">
                          {item.variantLabel}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discountAmount > 0 ? (
                      <span className="text-muted-foreground">
                        -{formatCurrency(item.discountAmount)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              {invoice.coupon && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Coupon ({invoice.coupon.code})
                  </span>
                  <span className="font-medium text-muted-foreground">
                    -{formatCurrency(invoice.couponDiscountAmount ?? 0)}
                  </span>
                </div>
              )}
              {!!invoice.shippingAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.shippingAmount)}
                  </span>
                </div>
              )}
              {!!invoice.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">
                  {formatCurrency(invoice.total)} {invoice?.currency}
                </span>
              </div>
              {!!invoice.effectivePaid && (
                <>
                  <div className="pt-2 mt-2 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Effective paid
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          invoice.effectivePaid ??
                            (invoice.paidAmount ?? 0) -
                              (invoice.refundedAmount ?? 0),
                        )}{" "}
                        {invoice?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                      <span className="text-muted-foreground">
                        Remaining balance
                      </span>
                      <span
                        className={`font-bold ${
                          (invoice.remainingBalance ?? invoice.total) > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(
                          invoice.remainingBalance ?? invoice.total,
                        )}{" "}
                        {invoice?.currency}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              Transaction details and payment progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Paid Amount
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount ?? 0)}
                </span>
              </div>
              {!!invoice.refundedAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Refunded
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(invoice.refundedAmount)}
                  </span>
                </div>
              )}
              {!!invoice.paymentPercentage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Payment Progress
                    </span>
                    <span className="font-medium">
                      {invoice.paymentPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${invoice.paymentPercentage}%` }}
                    />
                  </div>
                </div>
              )}
              {invoice.totalTransactions !== undefined &&
                invoice.totalTransactions > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total Transactions</span>
                      <span>{invoice.totalTransactions}</span>
                    </div>
                    {invoice.paidTransactions !== undefined &&
                      invoice.paidTransactions > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Payments</span>
                          <span className="text-green-600">
                            {invoice.paidTransactions}
                          </span>
                        </div>
                      )}
                    {invoice.refundedTransactions !== undefined &&
                      invoice.refundedTransactions > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Refunds</span>
                          <span className="text-red-600">
                            {invoice.refundedTransactions}
                          </span>
                        </div>
                      )}
                  </div>
                )}
              {invoice.isFullyPaid && (
                <div className="pt-2">
                  <Badge variant="default" className="w-full justify-center">
                    Fully Paid
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Transactions
            </CardTitle>
            <CardDescription>
              Payments and refunds for this invoice
            </CardDescription>
          </div>
          {!isCancelledOrRefunded && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => setPaymentDialogOpen(true)}
              >
                <Banknote className="size-4" />
                Add Payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setRefundDialogOpen(true)}
                disabled={remainingBalance <= 0}
              >
                <RotateCcw className="size-4" />
                Add Refund
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center my-8">
              <Spinner />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Receipt className="size-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                No transactions yet
              </p>
              <p className="text-xs text-muted-foreground">
                Record a payment or refund to see them here.
              </p>
              {!isCancelledOrRefunded && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentDialogOpen(true)}
                  >
                    Add Payment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundDialogOpen(true)}
                    disabled={remainingBalance <= 0}
                  >
                    Add Refund
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {tx.createdAt
                        ? format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.type === TransactionType.PAYMENT
                            ? "default"
                            : "secondary"
                        }
                        className={
                          tx.type === TransactionType.REFUND
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : ""
                        }
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {tx.paymentMethod}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {tx.reference}
                    </TableCell>
                    <TableCell>
                      {isCancelledOrRefunded ? (
                        <Badge
                          variant={
                            tx.status === TransactionStatus.SUCCESS
                              ? "default"
                              : tx.status === TransactionStatus.FAILED
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {tx.status}
                        </Badge>
                      ) : (
                        <Select
                          value={tx.status}
                          onValueChange={(value) =>
                            updateTransaction({
                              transactionId: tx._id,
                              status: value,
                            })
                          }
                          disabled={isUpdatingTransaction}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(TransactionStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === TransactionType.REFUND
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.type === TransactionType.REFUND ? "-" : "+"}
                      {formatCurrency(tx.amount)} {invoice?.currency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      <AddTransactionDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={invoiceId}
        type={TransactionType.PAYMENT}
        remainingBalance={remainingBalance}
        currency={invoice?.currency}
      />
      <AddTransactionDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        invoiceId={invoiceId}
        type={TransactionType.REFUND}
        remainingBalance={remainingRefundableBalance}
        currency={invoice?.currency}
      />
    </div>
  );
}
