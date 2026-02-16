"use client";

import { useListInvoices } from "@/hooks/api/invoices";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency-base";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersTab() {
  const {
    data: invoicesData,
    status: invoicesStatus,
    fetchNextPage: fetchNextInvoicesPage,
    isFetchingNextPage: isFetchingNextInvoicesPage,
  } = useListInvoices({ limit: 24 });
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

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">My orders</h2>
      </CardHeader>
      <CardContent>
        {!invoices.length &&
        !(isFetchingNextInvoicesPage || invoicesStatus === "pending") ? (
          <p className="py-8 text-center text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <ul>
            {invoices.map((inv) => (
              <li key={inv._id} className="py-2 first:pt-0">
                <Link
                  href={`/invoices/${inv.invoiceNumber}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">
                      {inv.invoiceNumber ?? inv._id}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {inv.status}
                    </span>
                    {inv.isFullyPaid ? (
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-normal">
                        {inv.paymentPercentage != null &&
                        inv.paymentPercentage > 0
                          ? `Partial (${Math.round(inv.paymentPercentage)}%)`
                          : "Unpaid"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(inv.total)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div ref={ref} />
        {(isFetchingNextInvoicesPage || invoicesStatus === "pending") && (
          <div className="flex flex-col gap-4 m-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
