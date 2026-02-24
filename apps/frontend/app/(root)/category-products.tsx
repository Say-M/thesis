"use client";

import Link from "next/link";
import ProductCard, { type ProductCardProps } from "./common/product-card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useListCategories } from "@/hooks/api/categories";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";

function toProductCardProps(p: ProductDetail): ProductCardProps {
  const { price, oldPrice, stock, variantId } = productListItemToCardProps(p);
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    thumbnailUrl: p.thumbnail?.path ?? "",
    categoryName: p.category?.name,
    subcategoryName: p.subcategory?.name,
    price,
    oldPrice: oldPrice ?? undefined,
    featured: p.featured ?? false,
    status: p.status ?? true,
    stock,
    hasVariants: p.hasVariants ?? false,
    variantId,
  };
}

export default function CategoryProducts() {
  const {
    data: categoriesData,
    status: categoriesStatus,
    fetchNextPage,
    isFetchingNextPage: isFetchingNextCategoriesPage,
  } = useListCategories({
    status: "true",
    featured: "true",
    limit: 20,
  });

  const featuredCategories = categoriesData?.pages
    ?.map((page) => page.categories)
    .flat();
  const categoryIds = featuredCategories?.map((c) => c._id);

  const {
    data: productsData,
    status: productsStatus,
    fetchNextPage: fetchNextProductsPage,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = useListProducts({
    categories: categoryIds?.join(","),
    status: "true",
    limit: 100,
    enabled: !!categoryIds?.length,
  });

  const products =
    productsData?.pages?.map((page) => page.products).flat() ?? [];
  const productsByCategory = new Map<string, ProductDetail[]>();
  for (const p of products) {
    const catId = typeof p.category === "object" ? p.category?._id : p.category;
    if (catId) {
      const list = productsByCategory.get(catId) ?? [];
      if (list.length < 8) list.push(p);
      productsByCategory.set(catId, list);
    }
  }

  const sections = featuredCategories
    ?.map((cat) => ({
      category: cat,
      products: (productsByCategory.get(cat._id) ?? []).map(toProductCardProps),
    }))
    .filter((s) => s.products.length > 0);

  const isLoading =
    categoryIds?.length &&
    (categoriesStatus === "pending" || productsStatus === "pending");

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 my-8 space-y-8">
        {[1, 2].map((i) => (
          <section key={i} className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-lg border bg-card h-80 animate-pulse"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (!sections?.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-8 space-y-8">
      {sections?.map(({ category, products: categoryProducts }) => (
        <section key={category._id} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {category.name}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/products?category=${category._id}`}>
                View all
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categoryProducts.map((product) => (
              <ProductCard key={product._id} {...product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
