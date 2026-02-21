"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  useListBanners,
  useUpdateBanner,
  type BannerListItem,
} from "@/hooks/api/banners";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function BannersTable({
  search,
  status,
  onEdit,
  onDelete,
}: {
  search?: string;
  status?: string;
  onEdit?: (banner: BannerListItem) => void;
  onDelete?: (banner: BannerListItem) => void;
}) {
  const {
    data: bannersData,
    status: bannersStatus,
    fetchNextPage: fetchNextBannersPage,
    isFetchingNextPage: isFetchingNextBannersPage,
  } = useListBanners({ search, status });
  const banners = useMemo(
    () => bannersData?.pages?.map((page) => page.banners).flat() ?? [],
    [bannersData],
  );
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextBannersPage();
    }
  }, [inView, fetchNextBannersPage]);
  const { mutate: updateBanner } = useUpdateBanner();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Banner</TableHead>
            <TableHead className="min-w-[200px]">Description</TableHead>
            <TableHead className="w-[120px]">Serial</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[140px]">Link</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow key={banner._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm" className="size-8! rounded-sm shrink-0">
                    <AvatarImage
                      src={banner?.image?.path}
                      alt={banner?.title}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium rounded-sm">
                      {banner?.title?.charAt(0)?.toUpperCase() ?? "—"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{banner?.title}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[260px] line-clamp-2">
                {banner.description || "—"}
              </TableCell>
              <TableCell>{banner.serial}</TableCell>
              <TableCell>
                <Badge
                  variant={banner.status ? "default" : "secondary"}
                  className={!banner.status ? "opacity-75" : ""}
                >
                  {banner.status ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[220px] truncate">
                {banner.link ? (
                  <Link href={banner.link} target="_blank">
                    {banner.link}
                  </Link>
                ) : (
                  "—"
                )}
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
                    <DropdownMenuItem onSelect={() => onEdit?.(banner)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={banner.status?.toString()}
                            onValueChange={(value) => {
                              updateBanner({
                                id: banner._id,
                                payload: { status: value === "true" },
                              });
                            }}
                          >
                            <DropdownMenuRadioItem value="true">
                              Active
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="false">
                              Inactive
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => onDelete?.(banner)}
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
      {(isFetchingNextBannersPage || bannersStatus === "pending") && (
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
