"use client";

import { useMemo } from "react";
import ProductCard, {
  type ProductCardProps,
} from "../../../common/product-card";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";

type ProductDetailRelatedProps = {
  productId: string;
  categoryId?: string;
  subcategoryId?: string;
};

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
    oldPrice: oldPrice ?? undefined,
    featured: p.featured ?? false,
    status: p.status ?? true,
    stock,
    hasVariants: p.hasVariants ?? false,
    variantId,
    isFreeShipping: p.isFreeShipping ?? false,
  };
}

export function ProductDetailRelated({
  productId,
  categoryId,
  subcategoryId,
}: ProductDetailRelatedProps) {
  const categories = [categoryId, subcategoryId].filter(Boolean).join(",");
  const { data: productsData, status: productsStatus } = useListProducts({
    categories,
    status: "true",
    limit: 8,
    enabled: true,
  });

  const products = useMemo(
    () =>
      (productsData?.pages?.map((page) => page.products).flat() ?? [])
        .filter((p) => p._id !== productId)
        .map(toCardProps),
    [productsData],
  );

  if (products.length === 0 || productsStatus === "error") return null;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((relatedProduct) => (
          <ProductCard key={relatedProduct._id} {...relatedProduct} />
        ))}
      </div>
    </div>
  );
}
