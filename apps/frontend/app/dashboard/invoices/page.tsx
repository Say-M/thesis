"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoicesTable from "./table";
import { InvoiceStatus, InvoiceType } from "@repo/common/enums/invoice";
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
import { useDeleteInvoice, type InvoiceListItem } from "@/hooks/api/invoices";
import { Button } from "@/components/ui/button";

const SEARCH_DEBOUNCE_MS = 300;

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceTypeFilter = "all" | InvoiceType;

export default function InvoicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");

  const [invoiceToDelete, setInvoiceToDelete] =
    useState<InvoiceListItem | null>(null);
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete._id, {
        onSettled: () => setInvoiceToDelete(null),
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
            placeholder="Search invoices"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search invoices"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as InvoiceStatusFilter)}
          >
            <SelectTrigger size="default">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {Object.values(InvoiceStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as InvoiceTypeFilter)}
          >
            <SelectTrigger className="w-[130px]" size="default">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.values(InvoiceType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AlertDialog
        open={invoiceToDelete !== null}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice</AlertDialogTitle>
            {invoiceToDelete?.status === InvoiceStatus.CANCELLED ? (
              <AlertDialogDescription>
                Are you sure you want to delete &quot;
                {invoiceToDelete?.invoiceNumber}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                The invoice is not cancelled. Please cancel the invoice first.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {invoiceToDelete?.status === InvoiceStatus.CANCELLED
                ? "Cancel"
                : "Close"}
            </AlertDialogCancel>
            {invoiceToDelete?.status === InvoiceStatus.CANCELLED && (
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
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoicesTable
        search={searchQuery || undefined}
        status={
          statusFilter === "all" ? undefined : [statusFilter as InvoiceStatus]
        }
        type={typeFilter === "all" ? undefined : [typeFilter as InvoiceType]}
        onDelete={setInvoiceToDelete}
      />
    </div>
  );
}
