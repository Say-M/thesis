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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  useListCoupons,
  useUpdateCoupon,
  useDeleteCoupon,
  type CouponListItem,
} from "@/hooks/api/coupons";
import { useFormatCurrency } from "@/lib/format-currency";
import { DiscountType } from "@app/backend/enums/discount";
import { format } from "date-fns";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function CouponsTable({
  search,
  status,
  onEdit,
}: {
  search?: string;
  status?: boolean[];
  onEdit?: (coupon: CouponListItem) => void;
}) {
  const formatCurrency = useFormatCurrency();
  const {
    data: couponsData,
    status: couponsStatus,
    fetchNextPage: fetchNextCouponsPage,
    isFetchingNextPage: isFetchingNextCouponsPage,
  } = useListCoupons({ search, status });
  const coupons = useMemo(
    () => couponsData?.pages?.map((page) => page.coupons).flat() ?? [],
    [couponsData],
  );
  const { mutate: updateCoupon } = useUpdateCoupon();
  const { mutate: deleteCoupon } = useDeleteCoupon();
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextCouponsPage();
    }
  }, [inView, fetchNextCouponsPage]);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Code</TableHead>
            <TableHead className="min-w-[180px]">Description</TableHead>
            <TableHead className="w-[130px]">Discount</TableHead>
            <TableHead className="w-[100px]">Min. purchase</TableHead>
            <TableHead className="w-[90px]">Usage</TableHead>
            <TableHead className="w-[80px]">Per user</TableHead>
            <TableHead className="w-[90px]">Free shipping</TableHead>
            <TableHead className="w-[150px]">Valid period</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => {
            const discountText =
              coupon.discountType === DiscountType.PERCENTAGE
                ? ` ${coupon.value}%`
                : formatCurrency(coupon.value);
            const usageText =
              coupon.usageLimit === -1
                ? `${coupon.usedCount} / ∞`
                : `${coupon.usedCount} / ${coupon.usageLimit}`;
            const perUserText =
              coupon.perUserLimit === -1 ? "∞" : String(coupon.perUserLimit);
            const now = new Date();
            const validFromDate = coupon.validFrom
              ? new Date(coupon.validFrom)
              : null;
            const validToDate = coupon.validTo
              ? new Date(coupon.validTo)
              : null;
            const isStarted = !validFromDate || validFromDate <= now;
            const isExpired =
              validToDate != null &&
              !Number.isNaN(validToDate.getTime()) &&
              validToDate < now;

            return (
              <TableRow key={coupon._id}>
                <TableCell className="font-mono text-sm font-medium">
                  {coupon.code}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[220px] line-clamp-2 text-sm">
                  {coupon.description || "—"}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground text-xs uppercase">
                      {coupon.discountType === DiscountType.PERCENTAGE
                        ? "Percentage"
                        : "Fixed"}
                    </span>
                    <span className="font-medium tabular-nums">
                      {discountText}
                    </span>
                    {coupon.maxDiscount != null && coupon.maxDiscount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Max: {formatCurrency(coupon.maxDiscount)}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground text-sm">
                  {coupon.minPurchase != null && coupon.minPurchase > 0
                    ? formatCurrency(coupon.minPurchase)
                    : "—"}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground text-sm">
                  {usageText}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground text-sm">
                  {perUserText}
                </TableCell>
                <TableCell className="text-sm">
                  {coupon.freeShipping ? (
                    <Badge variant="outline" className="font-normal">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="space-y-0.5">
                    {coupon.validFrom && (
                      <p>
                        From:{" "}
                        {format(new Date(coupon.validFrom), "PP hh:mm aa")}
                      </p>
                    )}
                    {coupon.validTo && (
                      <p>
                        To: {format(new Date(coupon.validTo), "PP hh:mm aa")}
                      </p>
                    )}
                    {!coupon.validFrom && !coupon.validTo && (
                      <p className="text-muted-foreground">Always</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      coupon.status && isStarted && !isExpired
                        ? "default"
                        : "secondary"
                    }
                    className={
                      !coupon.status || !isStarted || isExpired
                        ? "opacity-75"
                        : ""
                    }
                  >
                    {isExpired
                      ? "Expired"
                      : !isStarted
                        ? "Not started"
                        : coupon.status
                          ? "Active"
                          : "Inactive"}
                  </Badge>
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
                      <DropdownMenuItem onSelect={() => onEdit?.(coupon)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Change status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={coupon.status?.toString()}
                              onValueChange={(value) => {
                                updateCoupon({
                                  id: coupon._id,
                                  payload: { status: value === "true" },
                                });
                              }}
                            >
                              <DropdownMenuRadioItem value="true">
                                Active
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="false">
                                Inactive
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => deleteCoupon(coupon._id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextCouponsPage || couponsStatus === "pending") && (
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
