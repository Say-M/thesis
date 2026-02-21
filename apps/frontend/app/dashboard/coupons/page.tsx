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
import { useDeleteCoupon, type CouponListItem } from "@/hooks/api/coupons";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

const SEARCH_DEBOUNCE_MS = 300;

export type CouponStatusFilter = "all" | "active" | "inactive";

export default function CouponsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponListItem | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatusFilter>("all");
  const [couponToDelete, setCouponToDelete] = useState<CouponListItem | null>(
    null,
  );
  const { mutate: deleteCoupon, isPending: isDeleting } = useDeleteCoupon();
  const handleConfirmDelete = () => {
    if (couponToDelete) {
      deleteCoupon(couponToDelete._id, {
        onSettled: () => setCouponToDelete(null),
      });
    }
  };
  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            type="text"
            placeholder="Search coupons"
            className="w-full min-w-2xs max-w-sm"
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

      <AlertDialog
        open={couponToDelete !== null}
        onOpenChange={(open) => !open && setCouponToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{couponToDelete?.code}&quot;?
            This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner className="size-4" />}
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        onDelete={setCouponToDelete}
      />
    </div>
  );
}
