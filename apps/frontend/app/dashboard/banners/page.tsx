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
import BannersTable from "./table";
import AddEditBannerDialog from "./add-edit-banner-dialog";
import type { BannerListItem } from "@/hooks/api/banners";

const SEARCH_DEBOUNCE_MS = 300;

export default function BannersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerListItem | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("true,false");

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
            placeholder="Search banners"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search banners"
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
        </div>
        <div>
          <AddEditBannerDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingBanner(null);
            }}
            banner={editingBanner}
            button={
              <Button
                type="button"
                onClick={() => {
                  setEditingBanner(null);
                  setDialogOpen(true);
                }}
              >
                Add Banner
              </Button>
            }
          />
        </div>
      </div>
      <BannersTable
        search={searchQuery || undefined}
        status={statusFilter}
        onEdit={(banner) => {
          setEditingBanner(banner);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}
