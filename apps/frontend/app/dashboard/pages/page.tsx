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
import PagesTable from "./table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SEARCH_DEBOUNCE_MS = 300;

export default function PagesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("true,false");

  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 max-w-2xl flex-1 items-center gap-3">
          <Input
            type="text"
            placeholder="Search pages (title, slug)"
            className="max-w-sm min-w-[140px] w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search pages"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
          >
            <SelectTrigger size="default" className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true,false">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button asChild>
            <Link href="/dashboard/pages/create">Add Page</Link>
          </Button>
        </div>
      </div>
      <PagesTable search={searchQuery || undefined} status={statusFilter} />
    </div>
  );
}
