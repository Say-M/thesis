"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BlocklistsTable from "./table";
import AddBlocklistDialog from "./add-blocklist-dialog";
import { useDeleteBlocklist, type BlocklistListItem } from "@/hooks/api/blocklists";
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

export default function BlocklistsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [blocklistToDelete, setBlocklistToDelete] =
    useState<BlocklistListItem | null>(null);
  const { mutate: deleteBlocklist, isPending: isDeleting } =
    useDeleteBlocklist();

  const handleConfirmDelete = () => {
    if (blocklistToDelete) {
      deleteBlocklist(blocklistToDelete._id, {
        onSettled: () => setBlocklistToDelete(null),
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
            placeholder="Search blocklists"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search blocklists"
          />
        </div>
        <div>
          <AddBlocklistDialog
            open={dialogOpen}
            onOpenChange={(open) => setDialogOpen(open)}
            button={
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
              >
                Add Blocklist
              </Button>
            }
          />
        </div>
      </div>

      <AlertDialog
        open={blocklistToDelete !== null}
        onOpenChange={(open) => !open && setBlocklistToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete blocklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{blocklistToDelete?.mobile}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
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

      <BlocklistsTable
        search={searchQuery || undefined}
        onDelete={setBlocklistToDelete}
      />
    </div>
  );
}
