"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import AddEditCategoryDialog from "./add-edit-category-dialog";
import { Button } from "@/components/ui/button";
import CategoriesTable from "./table";
import type { CategoryDetail } from "@/hooks/api/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEARCH_DEBOUNCE_MS = 300;

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDetail | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("true,false");
  const [typeFilter, setTypeFilter] = useState("parent,child");

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
            placeholder="Search categories"
            className="w-full min-w-[140px] max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search categories"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
          >
            <SelectTrigger className="w-[130px]" size="default">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true,false">All status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
            <SelectTrigger className="w-[130px]" size="default">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent,child">All types</SelectItem>
              <SelectItem value="parent">Parent only</SelectItem>
              <SelectItem value="child">Child only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <AddEditCategoryDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingCategory(null);
            }}
            category={editingCategory}
            button={
              <Button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setDialogOpen(true);
                }}
              >
                Add Category
              </Button>
            }
          />
        </div>
      </div>
      <CategoriesTable
        search={searchQuery || undefined}
        status={statusFilter}
        type={typeFilter}
        onEdit={(category) => {
          setEditingCategory(category);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}
