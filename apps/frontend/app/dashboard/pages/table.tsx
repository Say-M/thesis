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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useListPages, useUpdatePage, useDeletePage } from "@/hooks/api/pages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function PagesTable({
  search,
  status,
}: {
  search?: string;
  status?: string;
}) {
  const router = useRouter();
  const {
    data: pagesData,
    status: pagesStatus,
    fetchNextPage: fetchNextPagesPage,
    isFetchingNextPage: isFetchingNextPagesPage,
  } = useListPages({ search, status });
  const pages = useMemo(
    () => pagesData?.pages?.map((page) => page.pages).flat() ?? [],
    [pagesData],
  );
  console.log({ pages }, pagesData);
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextPagesPage();
    }
  }, [inView, fetchNextPagesPage]);
  const { mutate: updatePage } = useUpdatePage();
  const { mutate: deletePage } = useDeletePage();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Title</TableHead>
            <TableHead className="w-[140px]">Slug</TableHead>
            <TableHead className="w-[90px]">Order</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Visibility</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm" className="size-9 shrink-0 rounded-sm">
                    <AvatarImage
                      src={page?.featuredImage?.path}
                      alt={page?.title}
                    />
                    <AvatarFallback className="rounded-sm bg-muted text-xs font-medium text-muted-foreground">
                      {page?.title?.charAt(0)?.toUpperCase() ?? "—"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{page.title}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {page.slug}
              </TableCell>
              <TableCell>{page.order ?? 0}</TableCell>
              <TableCell>
                <Badge
                  variant={page.status ? "default" : "secondary"}
                  className={!page.status ? "opacity-75" : ""}
                >
                  {page.status ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {page.showInHeader && (
                  <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5">
                    Header
                  </span>
                )}
                {page.showInFooter && (
                  <span className="rounded bg-muted px-1.5 py-0.5">Footer</span>
                )}
                {!page.showInHeader && !page.showInFooter && "—"}
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
                    <DropdownMenuItem asChild>
                      <Link href={`/pages/${page.slug}`} target="_blank">
                        View page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/pages/${page._id}`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        router.push(`/dashboard/seo/${page._id}?type=page`)
                      }
                    >
                      {page.seo ? "Edit SEO" : "Add SEO"}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={page.status?.toString()}
                            onValueChange={(value) => {
                              updatePage({
                                id: page._id,
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
                      onSelect={() => deletePage(page._id)}
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
      {(isFetchingNextPagesPage || pagesStatus === "pending") && (
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
