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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useListProducts, useUpdateProduct } from "@/hooks/api/products";
import { useFormatCurrency } from "@/lib/format-currency";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsTable({
  search,
  status,
  featured,
}: {
  search?: string;
  status: string;
  featured: string;
}) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const { mutate: updateProduct } = useUpdateProduct();
  const { ref, inView } = useInView({ threshold: 0.8 });

  const {
    data: productsData,
    status: productsStatus,
    fetchNextPage: fetchNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = useListProducts({ search, status, featured });

  const products = useMemo(
    () => productsData?.pages?.map((page) => page?.products ?? []).flat() ?? [],
    [productsData],
  );

  useEffect(() => {
    if (inView) {
      fetchNextProductsPage();
    }
  }, [inView, fetchNextProductsPage]);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Product</TableHead>
            <TableHead className="min-w-[180px]">Category</TableHead>
            <TableHead className="min-w-[140px]">Subcategory</TableHead>
            <TableHead className="w-[120px]">Price</TableHead>
            <TableHead className="w-[100px]">Stock</TableHead>
            <TableHead className="w-[100px]">Unit</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Featured</TableHead>
            <TableHead className="w-[100px]">Free shipping</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product?._id ?? ""}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm" className="size-10! rounded-sm shrink-0">
                    <AvatarImage
                      src={product?.thumbnail?.path}
                      alt={product?.name ?? ""}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium rounded-sm">
                      {product?.name?.charAt(0)?.toUpperCase() ?? "—"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="font-medium">{product?.name ?? ""}</p>
                    <p className="text-xs text-muted-foreground">
                      {product?.slug ?? ""}
                    </p>
                    {product?.hasVariants &&
                      Array.isArray(product?.variants) && (
                        <p className="text-xs text-muted-foreground">
                          {product?.variants?.length ?? 0}{" "}
                          {product?.variants?.length === 1
                            ? "variant"
                            : "variants"}
                        </p>
                      )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.subcategory?.name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product?.hasVariants && Array.isArray(product?.variants)
                  ? (() => {
                      const prices = (product?.variants ?? [])
                        .map((v) => v?.sellingPrice)
                        .filter((v): v is number => typeof v === "number");
                      if (!prices.length) return "—";
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      if (!isFinite(min) || !isFinite(max)) return "—";
                      if (min === max) return formatCurrency(min);
                      return `From ${formatCurrency(min)}`;
                    })()
                  : product?.sellingPrice != null
                    ? formatCurrency(product.sellingPrice)
                    : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {typeof (product as any)?.totalStock === "number"
                  ? (product as any).totalStock
                  : (product?.stock ?? 0)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product?.hasVariants && Array.isArray(product?.variants)
                  ? (() => {
                      const units = (product?.variants ?? [])
                        .map((v) => v?.unit)
                        .filter(
                          (v): v is string =>
                            typeof v === "string" && v.length > 0,
                        );
                      if (!units.length) {
                        return product?.unit || "—";
                      }
                      const uniqueUnits = Array.from(new Set(units));
                      if (uniqueUnits.length === 1) return uniqueUnits[0]!;
                      return `${uniqueUnits.length} units`;
                    })()
                  : product?.unit || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={product?.status ? "default" : "secondary"}
                  className={!product?.status ? "opacity-75" : ""}
                >
                  {product?.status ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={product?.featured ? "default" : "secondary"}
                  className={!product?.featured ? "opacity-75" : ""}
                >
                  {product?.featured ? "Featured" : "Not Featured"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={product?.isFreeShipping ? "default" : "secondary"}
                  className={!product?.isFreeShipping ? "opacity-75" : ""}
                >
                  {product?.isFreeShipping ? "Yes" : "No"}
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
                      onSelect={() =>
                        router.push(`/dashboard/products/${product?._id ?? ""}`)
                      }
                    >
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => {
                        router.push(
                          `/dashboard/seo/${product?._id ?? ""}?type=product`,
                        );
                      }}
                    >
                      {product?.seo ? "Edit SEO" : "Add SEO"}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Change status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            value={product?.status?.toString()}
                            onValueChange={(value) => {
                              updateProduct({
                                id: product?._id ?? "",
                                payload: {
                                  status: value === "true",
                                  deleteImages: [],
                                },
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
                      onSelect={() =>
                        updateProduct({
                          id: product?._id ?? "",
                          payload: {
                            featured: !product?.featured,
                            deleteImages: [],
                          },
                        })
                      }
                    >
                      {product?.featured
                        ? "Mark as not featured"
                        : "Mark as featured"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        updateProduct({
                          id: product?._id ?? "",
                          payload: {
                            isFreeShipping: !product?.isFreeShipping,
                            deleteImages: [],
                          },
                        })
                      }
                    >
                      {product?.isFreeShipping
                        ? "Mark as not free shipping"
                        : "Mark as free shipping"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextProductsPage || productsStatus === "pending") && (
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
