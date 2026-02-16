"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CouponsTable from "./table";
import AddEditCouponDialog from "./add-edit-coupon-dialog";
import type { CouponListItem } from "@/hooks/api/coupons";

const SEARCH_DEBOUNCE_MS = 300;

export type CouponStatusFilter = "all" | "active" | "inactive";

export default function CouponsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponListItem | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CouponStatusFilter>("all");

  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-2xl">
          <Input
            type="text"
            placeholder="Search coupons"
            className="w-full min-w-[140px] max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search coupons"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CouponStatusFilter)}
          >
            <SelectTrigger size="default">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <AddEditCouponDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingCoupon(null);
            }}
            coupon={editingCoupon}
            button={
              <Button
                type="button"
                onClick={() => {
                  setEditingCoupon(null);
                  setDialogOpen(true);
                }}
              >
                Add Coupon
              </Button>
            }
          />
        </div>
      </div>
      <CouponsTable
        search={searchQuery || undefined}
        status={
          statusFilter === "all"
            ? undefined
            : statusFilter === "active"
              ? [true]
              : [false]
        }
        onEdit={(coupon) => {
          setEditingCoupon(coupon);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}
