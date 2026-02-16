"use client";

import { useMemo } from "react";
import ProductCard, { type ProductCardProps } from "./common/product-card";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";

function toProductCardProps(p: ProductDetail): ProductCardProps {
  const { price, oldPrice, stock } = productListItemToCardProps(p);
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
  };
}

export default function Featured() {
  const { data: productsData, status: productsStatus } = useListProducts({
    featured: "true",
    status: "true",
    limit: 12,
  });

  const products = useMemo(
    () => productsData?.pages?.map((page) => page.products).flat() ?? [],
    [productsData],
  );

  if (productsStatus === "pending") {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 my-8">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Featured products
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card h-80 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0 && productsStatus === "error") return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Featured products
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard key={product._id} {...toProductCardProps(product)} />
        ))}
      </div>
    </section>
  );
}
