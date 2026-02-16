"use client";

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
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useListInvoices, useUpdateInvoice } from "@/hooks/api/invoices";
import { useFormatCurrency } from "@/lib/format-currency";
import { InvoiceStatus } from "@app/backend/enums/invoice";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesTable({
  search,
  status,
  type,
}: {
  search?: string;
  status?: string[];
  type?: string[];
}) {
  const formatCurrency = useFormatCurrency();
  const {
    data: invoicesData,
    status: invoicesStatus,
    fetchNextPage: fetchNextInvoicesPage,
    isFetchingNextPage: isFetchingNextInvoicesPage,
  } = useListInvoices({ search, status, type });
  const invoices = useMemo(
    () => invoicesData?.pages?.map((page) => page.invoices).flat() ?? [],
    [invoicesData],
  );
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextInvoicesPage();
    }
  }, [inView, fetchNextInvoicesPage]);
  const { mutate: updateInvoice } = useUpdateInvoice();
  const router = useRouter();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Invoice Number</TableHead>
            <TableHead className="min-w-[200px]">Customer</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="w-[120px]">Subtotal</TableHead>
            <TableHead className="w-[120px]">Total</TableHead>
            <TableHead className="w-[120px]">Paid</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice._id}>
              <TableCell className="font-mono font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium">{invoice.customer?.name ?? "—"}</p>
                  {invoice.customer?.email && (
                    <p className="text-xs text-muted-foreground">
                      {invoice.customer.email}
                    </p>
                  )}
                  {invoice.customer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {invoice.customer.phone}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{invoice.type}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCurrency(invoice.subtotal)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(invoice.total)}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium ${
                        (invoice.effectivePaid ?? 0) > 0
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(invoice.effectivePaid ?? 0)}
                    </span>
                  </div>
                  {invoice.remainingBalance !== undefined &&
                    invoice.remainingBalance !== invoice.total && (
                      <p className="text-xs text-muted-foreground">
                        Remaining:{" "}
                        {formatCurrency(invoice.remainingBalance ?? 0)}
                      </p>
                    )}
                  {invoice.paymentPercentage !== undefined && (
                    <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, invoice.paymentPercentage)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    invoice.status === InvoiceStatus.DELIVERED
                      ? "default"
                      : invoice.status === InvoiceStatus.CANCELLED ||
                          invoice.status === InvoiceStatus.REFUNDED
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {invoice.createdAt
                  ? format(new Date(invoice.createdAt), "PP hh:mm aa")
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
                        router.push(`/dashboard/invoices/${invoice._id}`)
                      }
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={invoice.status}
                            onValueChange={(value) => {
                              updateInvoice({
                                id: invoice._id,
                                payload: {
                                  status: value as InvoiceStatus,
                                },
                              });
                            }}
                          >
                            {Object.values(InvoiceStatus).map((status) => (
                              <DropdownMenuRadioItem
                                key={status}
                                value={status}
                              >
                                {status}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextInvoicesPage || invoicesStatus === "pending") && (
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
