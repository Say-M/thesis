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
import OrdersTable from "./table";
import { InvoiceStatus } from "@repo/common/enums/invoice";

const SEARCH_DEBOUNCE_MS = 300;

export type OrderStatusFilter = "all" | InvoiceStatus;

export default function OrdersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");

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
            placeholder="Search orders"
            className="w-full min-w-[140px] max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search orders"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as OrderStatusFilter)}
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
        </div>
      </div>
      <OrdersTable
        search={searchQuery || undefined}
        status={
          statusFilter === "all" ? undefined : [statusFilter as InvoiceStatus]
        }
      />
    </div>
  );
}
