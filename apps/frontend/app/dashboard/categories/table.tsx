"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useListCategories, useUpdateCategory } from "@/hooks/api/categories";
import type { CategoryDetail } from "@/hooks/api/categories";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesTable({
  search,
  status,
  type,
  onEdit,
}: {
  search?: string;
  status?: string;
  type?: string;
  onEdit?: (category: CategoryDetail) => void;
}) {
  const router = useRouter();
  const {
    data: categoriesData,
    status: categoriesStatus,
    isFetchingNextPage: isFetchingNextCategoriesPage,
    fetchNextPage: fetchNextCategoriesPage,
  } = useListCategories({ search, status, type });
  const categories = useMemo(
    () => categoriesData?.pages?.map((page) => page.categories).flat() ?? [],
    [categoriesData],
  );
  const { mutate: updateCategory } = useUpdateCategory();
  const { ref, inView } = useInView({ threshold: 0.8 });

  useEffect(() => {
    if (inView) {
      fetchNextCategoriesPage();
    }
  }, [inView, fetchNextCategoriesPage]);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Category</TableHead>
            <TableHead className="min-w-[180px]">Description</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Featured</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category?._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm" className="size-8! rounded-sm shrink-0">
                    <AvatarImage
                      src={category?.thumbnail?.path}
                      alt={category?.name}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium rounded-sm">
                      {category?.name?.charAt(0)?.toUpperCase() ?? "—"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{category?.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[240px] line-clamp-2">
                {category?.description?.slice(0, 100) ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {category?.parentCategory?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={category?.status ? "default" : "secondary"}
                  className={!category?.status ? "opacity-75" : ""}
                >
                  {category?.status ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={category?.featured ? "default" : "outline"}
                  className={!category?.featured ? "opacity-75" : ""}
                >
                  {category?.featured ? "Featured" : "Not featured"}
                </Badge>
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
                      onSelect={() => category && onEdit?.(category)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        router.push(
                          `/dashboard/seo/${category._id}?type=category`,
                        );
                      }}
                    >
                      {category.seo ? "Edit SEO" : "Add SEO"}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={category?.status?.toString()}
                            onValueChange={(value) => {
                              updateCategory({
                                id: category._id,
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
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Set featured
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={
                              category?.featured === true ? "true" : "false"
                            }
                            onValueChange={(value) => {
                              updateCategory({
                                id: category._id,
                                payload: { featured: value === "true" },
                              });
                            }}
                          >
                            <DropdownMenuRadioItem value="true">
                              Featured
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="false">
                              Not featured
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextCategoriesPage || categoriesStatus === "pending") && (
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
