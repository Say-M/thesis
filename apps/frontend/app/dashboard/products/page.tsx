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
import { useRouter } from "next/navigation";
import ProductsTable from "./table";

const SEARCH_DEBOUNCE_MS = 300;

export default function ProductsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("true,false");
  const [featuredFilter, setFeaturedFilter] = useState("true,false");

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
            placeholder="Search products"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
          >
            <SelectTrigger size="default">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true,false">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={featuredFilter}
            onValueChange={(v) => setFeaturedFilter(v)}
          >
            <SelectTrigger size="default">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true,false">All featured</SelectItem>
              <SelectItem value="true">Featured</SelectItem>
              <SelectItem value="false">Not featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => router.push("/dashboard/products/create")}
          >
            Add Product
          </Button>
        </div>
      </div>

      <ProductsTable
        search={searchQuery || undefined}
        status={statusFilter}
        featured={featuredFilter}
      />
    </div>
  );
}
