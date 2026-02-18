"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useGetOrder } from "@/hooks/api/orders";
import { useFormatCurrency } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@repo/common/enums/invoice";
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

export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const { data, isLoading } = useGetOrder(orderId);

  console.log({ data });

  const order = data?.data?.invoice;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">{order.invoiceNumber}</p>
        </div>
        <Badge
          variant={
            order.status === InvoiceStatus.DELIVERED
              ? "default"
              : order.status === InvoiceStatus.CANCELLED ||
                  order.status === InvoiceStatus.REFUNDED
                ? "destructive"
                : "secondary"
          }
          className="text-sm"
        >
          {order.status}
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
              <p className="font-medium">{order.customer?.name ?? "—"}</p>
            </div>
            {order.customer?.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order?.customer?.email ?? ""}</p>
              </div>
            )}
            {order.customer?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order?.customer?.phone ?? ""}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono font-medium">{order?.invoiceNumber ?? ""}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.billingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{order?.billingAddress?.name ?? ""}</p>
              {order?.billingAddress?.email && (
                <p className="text-sm text-muted-foreground">
                  {order?.billingAddress?.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {order?.billingAddress?.phone ?? ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {order?.billingAddress?.address ?? ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {order?.billingAddress?.city}, {order?.billingAddress?.state}{" "}
                {order?.billingAddress?.postalCode}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{order?.shippingAddress?.name ?? ""}</p>
              {order?.shippingAddress?.email && (
                <p className="text-sm text-muted-foreground">
                  {order?.shippingAddress?.email}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {order?.shippingAddress?.phone ?? ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {order?.shippingAddress?.address ?? ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {order?.shippingAddress?.city}, {order?.shippingAddress?.state}{" "}
                {order?.shippingAddress?.postalCode}
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
              {order.items?.map((item, index) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.coupon && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Coupon ({order?.coupon?.code ?? ""})
                </span>
                <span className="font-medium text-muted-foreground">
                  -{formatCurrency(order.couponDiscountAmount)}
                </span>
              </div>
            )}
            {!!order.shippingAmount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">
                  {formatCurrency(order.shippingAmount)}
                </span>
              </div>
            )}
            {!!order.taxAmount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">
                  {formatCurrency(order.taxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(order.total)} {order.currency}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
