"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductCard, { type ProductCardProps } from "../common/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";
import { useListCategories } from "@/hooks/api/categories";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useInView } from "react-intersection-observer";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

function toCardProps(p: ProductDetail): ProductCardProps {
  const { price, oldPrice, stock, variantId } = productListItemToCardProps(p);
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    thumbnailUrl: p.thumbnail?.path ?? "",
    categoryName: p.category?.name,
    subcategoryName: p.subcategory?.name,
    price,
    oldPrice,
    stock,
    featured: p.featured,
    status: p.status,
    hasVariants: p.hasVariants,
    variantId,
  };
}

export default function ProductsListingClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? undefined;
  const subcategoryParam = searchParams.get("subcategory") ?? undefined;
  const searchParam = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(searchParam);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const {
    data: productsData,
    status: productsStatus,
    fetchNextPage: fetchNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = useListProducts({
    search: searchParam || undefined,
    categories: [categoryParam, subcategoryParam].filter(Boolean).join(","),
    status: "true",
    limit: 24,
  });
  const products = useMemo(
    () => productsData?.pages?.map((page) => page.products).flat() ?? [],
    [productsData],
  );
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextProductsPage();
    }
  }, [inView, fetchNextProductsPage]);

  const { data: categoriesData } = useListCategories({
    status: "true",
    type: "parent",
    all: "true",
  });
  const { data: subcategoriesData } = useListCategories({
    status: "true",
    type: "child",
    all: "true",
  });

  const categories =
    categoriesData?.pages?.map((page) => page.categories).flat() ?? [];
  const subcategories =
    subcategoriesData?.pages?.map((page) => page.categories).flat() ?? [];

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case "price-low":
        list.sort((a, b) => {
          const ap = productListItemToCardProps(a).price;
          const bp = productListItemToCardProps(b).price;
          return ap - bp;
        });
        break;
      case "price-high":
        list.sort((a, b) => {
          const ap = productListItemToCardProps(a).price;
          const bp = productListItemToCardProps(b).price;
          return bp - ap;
        });
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        break;
    }
    return list;
  }, [products, sortBy]);

  const cardList = useMemo(
    () => sortedProducts.map(toCardProps),
    [sortedProducts],
  );

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ search: searchInput.trim() || null });
  };

  const handleCategoryChange = (value: string) => {
    setParams({ category: value === "all" ? null : value });
  };
  const handleSubcategoryChange = (value: string) => {
    setParams({ subcategory: value === "all" ? null : value });
  };

  const clearFilters = () => {
    setSearchInput("");
    setParams({ category: null, search: null, featured: null });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover our complete collection of quality products
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <InputGroup>
            <InputGroupInput
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <InputGroupButton type="submit">
              <Search className="size-4" />
            </InputGroupButton>
          </InputGroup>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={categoryParam ?? "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={subcategoryParam ?? "all"}
            onValueChange={handleSubcategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="mb-6" />

      {!cardList.length ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products found</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {cardList.map((product) => (
            <ProductCard key={product._id} {...product} />
          ))}
        </div>
      )}
      <div ref={ref} />
      {(isFetchingNextProductsPage || productsStatus === "pending") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-muted/50 h-80 animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}
