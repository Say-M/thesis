"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useListOrders } from "@/hooks/api/orders";
import { useFormatCurrency } from "@/lib/format-currency";
import { InvoiceStatus } from "@repo/common/enums/invoice";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersTable({
  search,
  status,
}: {
  search?: string;
  status?: string[];
}) {
  const formatCurrency = useFormatCurrency();
  const {
    data: ordersData,
    status: ordersStatus,
    fetchNextPage: fetchNextOrdersPage,
    isFetchingNextPage: isFetchingNextOrdersPage,
  } = useListOrders({ search, status });

  const orders = useMemo(
    () => ordersData?.pages?.map((page) => page.orders).flat() ?? [],
    [ordersData],
  );

  console.log({ orders }, ordersData);
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextOrdersPage();
    }
  }, [inView, fetchNextOrdersPage]);
  const router = useRouter();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Order Number</TableHead>
            <TableHead className="min-w-[200px]">Customer</TableHead>
            <TableHead className="w-[120px]">Subtotal</TableHead>
            <TableHead className="w-[120px]">Total</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders?.map((order) => (
            <TableRow key={order?._id}>
              <TableCell className="font-mono font-medium">
                {order?.invoiceNumber}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium">{order?.customer?.name ?? "—"}</p>
                  {order?.customer?.email && (
                    <p className="text-xs text-muted-foreground">
                      {order?.customer.email}
                    </p>
                  )}
                  {order?.customer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {order?.customer.phone}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCurrency(order?.subtotal)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(order?.total)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    order?.status === InvoiceStatus.DELIVERED
                      ? "default"
                      : order?.status === InvoiceStatus.CANCELLED ||
                          order?.status === InvoiceStatus.REFUNDED
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {order?.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {order?.createdAt
                  ? format(new Date(order?.createdAt), "PP hh:mm aa")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        router.push(`/dashboard/invoices/${order?._id}`)
                      }
                    >
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(ordersStatus === "pending" || isFetchingNextOrdersPage) && (
        <div className="flex flex-col gap-4 m-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
    </div>
  );
}
