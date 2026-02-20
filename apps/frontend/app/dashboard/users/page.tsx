"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UsersTable from "./table";
import EditUserDialog from "./edit-user-dialog";
import type { UserListItem } from "@/hooks/api/users";

const SEARCH_DEBOUNCE_MS = 300;

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("true,false");
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
            placeholder="Search users"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search users"
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
        </div>
      </div>

      <UsersTable
        search={searchQuery || undefined}
        status={statusFilter}
        onEdit={(user) => {
          setEditingUser(user);
          setEditDialogOpen(true);
        }}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingUser(null);
        }}
        user={editingUser}
      />
    </div>
  );
}
