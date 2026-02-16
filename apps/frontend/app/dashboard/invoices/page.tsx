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
import { InvoiceStatus, InvoiceType } from "@app/backend/enums/invoice";

const SEARCH_DEBOUNCE_MS = 300;

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceTypeFilter = "all" | InvoiceType;

export default function InvoicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");

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
            placeholder="Search invoices"
            className="w-full min-w-[140px] max-w-sm"
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
      <InvoicesTable
        search={searchQuery || undefined}
        status={
          statusFilter === "all" ? undefined : [statusFilter as InvoiceStatus]
        }
        type={typeFilter === "all" ? undefined : [typeFilter as InvoiceType]}
      />
    </div>
  );
}
