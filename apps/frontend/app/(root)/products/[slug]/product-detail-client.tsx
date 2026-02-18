"use client";

import { useState, useMemo, useEffect } from "react";
import { ProductDetailBreadcrumb } from "./components/product-detail-breadcrumb";
import { ProductDetailGallery } from "./components/product-detail-gallery";
import { ProductDetailInfo } from "./components/product-detail-info";
import { ProductDetailFaqs } from "./components/product-detail-faqs";
import { ProductDetailRelated } from "./components/product-detail-related";
import {
  ProductDetail,
  productListItemToCardProps,
} from "@/hooks/api/products";
import { SeoDetail } from "@/hooks/api/seo";

function useProductDisplayState(product: ProductDetail | null | undefined) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants?.[0]?._id,
  );
  const [quantity, setQuantity] = useState(1);

  const currentVariant = useMemo(() => {
    if (!product?.hasVariants || !product.variants?.length) return null;
    return (
      product?.variants?.find((v) => v._id === selectedVariantId) ??
      product?.variants?.[0]
    );
  }, [product, selectedVariantId]);

  const {
    price: displayPrice,
    oldPrice,
    discountAmount,
    stock: displayStock,
  } = productListItemToCardProps({ ...product!, variants: [currentVariant!] });

  const displayImages = useMemo(() => {
    if (!product) return [];
    const fromVariant =
      currentVariant?.images?.length &&
      Array.isArray(currentVariant.images) &&
      currentVariant.images.every(
        (i: unknown) => i && typeof i === "object" && "path" in i,
      )
        ? [...(currentVariant.images || []), ...(product.images || [])]
        : [];
    if (fromVariant.length) return fromVariant;
    const fromProduct =
      product.images?.length &&
      Array.isArray(product.images) &&
      product.images.every(
        (i: unknown) => i && typeof i === "object" && "path" in i,
      )
        ? [...(product.images || [])]
        : [];
    if (fromProduct.length) return fromProduct;
    const thumb = product.thumbnail;
    return thumb?.path ? [thumb] : [];
  }, [product, currentVariant]);

  const stockStatus: "in" | "low" | "out" =
    displayStock === 0 ? "out" : displayStock < 10 ? "low" : "in";

  return {
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    displayPrice,
    displayStock,
    discountAmount,
    displayImages,
    oldPrice,
    stockStatus,
    handleQuantityChange: (delta: number) => {
      setQuantity((prev) => Math.max(1, Math.min(displayStock, prev + delta)));
    },
  };
}

type ProductDetailClientProps = {
  product: ProductDetail | null;
  seo: SeoDetail | null;
};

export function ProductDetailClient({
  product,
  seo: _seo,
}: ProductDetailClientProps) {
  const {
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    discountAmount,
    displayPrice,
    displayStock,
    displayImages,
    oldPrice,
    stockStatus,
    handleQuantityChange,
  } = useProductDisplayState(product);

  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(displayStock, q)));
  }, [displayStock, setQuantity]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 text-center">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="text-muted-foreground mt-2">
          The product you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
    );
  }

  const productForInfo = product as unknown as ProductDetail;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-8 space-y-8">
      <ProductDetailBreadcrumb productName={product.name} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        <ProductDetailGallery
          images={displayImages}
          productName={product.name}
          videoLink={product.videoLink}
        />
        <ProductDetailInfo
          product={productForInfo}
          discountAmount={discountAmount}
          displayPrice={displayPrice}
          displayStock={displayStock}
          oldPrice={oldPrice}
          stockStatus={stockStatus}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
        />
      </div>

      <ProductDetailFaqs faqs={product.faqs ?? []} />

      <ProductDetailRelated
        productId={product._id}
        categoryId={product.category?._id}
        subcategoryId={product.subcategory?._id}
      />
    </div>
  );
}
