"use client";

import { useState, useMemo, useEffect } from "react";
import { ProductDetailBreadcrumb } from "./components/product-detail-breadcrumb";
import { ProductDetailGallery } from "./components/product-detail-gallery";
import { ProductDetailInfo } from "./components/product-detail-info";
import { ProductDetailFaqs } from "./components/product-detail-faqs";
import { ProductDetailRelated } from "./components/product-detail-related";
import { ProductDetail } from "@/hooks/api/products";
import { SeoDetail } from "@/hooks/api/seo";
import { DiscountType } from "@app/backend/enums/discount";

function useProductDisplayState(product: ProductDetail | null | undefined) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);

  const currentVariant = useMemo(() => {
    if (!product?.hasVariants || !product.variants?.length) return null;
    return (
      product.variants.find((v) => v._id === selectedVariantId) ??
      product.variants[0]
    );
  }, [product, selectedVariantId]);

  const displayPrice = currentVariant
    ? (currentVariant.sellingPrice ?? 0)
    : (product?.sellingPrice ?? 0);
  const displayStock = currentVariant
    ? (currentVariant.stock ?? 0)
    : (product?.stock ?? 0);

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

  const discountValue =
    currentVariant?.discountValue ?? product?.discountValue ?? 0;
  const discountType = (currentVariant?.discountType ??
    product?.discountType) as string | undefined;
  const oldPrice =
    discountValue > 0 && discountType === DiscountType.PERCENTAGE
      ? Math.round(displayPrice / (1 - discountValue / 100))
      : discountValue > 0 && discountType === DiscountType.FIXED
        ? displayPrice + discountValue
        : null;

  const stockStatus: "in" | "low" | "out" =
    displayStock === 0 ? "out" : displayStock < 10 ? "low" : "in";

  return {
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    displayPrice,
    displayStock,
    displayImages,
    oldPrice,
    stockStatus,
    handleQuantityChange: (delta: number) => {
      setQuantity((prev) => Math.max(1, Math.min(displayStock, prev + delta)));
    },
  };
}

type ProductDetailClientProps = {
  slug: string;
  product: ProductDetail | null;
  seo: SeoDetail | null;
};

export function ProductDetailClient({
  slug,
  product,
  seo: _seo,
}: ProductDetailClientProps) {
  const {
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
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
