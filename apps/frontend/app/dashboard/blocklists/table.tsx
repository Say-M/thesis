"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  useListBlocklists,
  type BlocklistListItem,
} from "@/hooks/api/blocklists";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function BlocklistsTable({
  search,
  onDelete,
}: {
  search?: string;
  onDelete?: (blocklist: BlocklistListItem) => void;
}) {
  const {
    data: blocklistsData,
    status: blocklistsStatus,
    fetchNextPage: fetchNextBlocklistsPage,
    isFetchingNextPage: isFetchingNextBlocklistsPage,
  } = useListBlocklists({ search });
  const blocklists = useMemo(
    () => blocklistsData?.pages?.map((page) => page.blocklists).flat() ?? [],
    [blocklistsData],
  );
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextBlocklistsPage();
    }
  }, [inView, fetchNextBlocklistsPage]);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Mobile Number</TableHead>
            <TableHead className="min-w-[300px]">Reason</TableHead>
            <TableHead className="w-[180px]">Date Added</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blocklists.map((blocklist) => (
            <TableRow key={blocklist._id}>
              <TableCell>{blocklist.mobile}</TableCell>
              <TableCell>
                <p className="line-clamp-3">{blocklist.reason || "—"}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {blocklist.createdAt
                  ? format(new Date(blocklist.createdAt), "PP hh:mm aa")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => onDelete?.(blocklist)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextBlocklistsPage || blocklistsStatus === "pending") && (
        <div className="flex flex-col gap-4 m-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
    </div>
  );
}
