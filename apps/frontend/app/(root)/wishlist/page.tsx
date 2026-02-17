"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, Trash2, ShoppingCart, ArrowLeft, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency-base";
import { cn } from "@/lib/utils";
import type { ProductCardProps } from "../common/product-card";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import {
  useListProducts,
  productListItemToCardProps,
  productListItemUnitPriceAndStock,
  type ProductDetail,
} from "@/hooks/api/products";
import { toast } from "sonner";

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

function buildWishlistItems(
  wishlist: { productId: string; variantId?: string }[],
  products: ProductDetail[],
): ProductCardProps[] {
  const byId = new Map(products.map((p) => [p._id, p]));
  const items: ProductCardProps[] = [];

  for (const line of wishlist) {
    const product = byId.get(line.productId);
    if (!product) continue;

    // Base card props (first-variant or product-level pricing)
    const base = toCardProps(product);

    // If a specific variant is stored in the wishlist, use that; otherwise fall back to base.
    const variantId = line.variantId ?? base.variantId;
    const { unitPrice, stock } = productListItemUnitPriceAndStock(
      product,
      variantId,
    );
    const variantLabel =
      variantId && product.variants
        ? product.variants.find((v) => v._id === variantId)?.name
        : undefined;

    items.push({
      ...base,
      // _id: variantId ? `${product._id}:${variantId}` : product._id,
      price: unitPrice,
      stock,
      variantId,
      variantLabel,
    });
  }

  return items;
}

export default function WishlistPage() {
  const {
    wishlistIds,
    wishlist,
    removeFromWishlist,
    addToCart,
    clearWishlist,
  } = useCartWishlist();
  const { data: productsData, isLoading } = useListProducts({
    productIds: wishlistIds.join(","),
    enabled: wishlistIds.length > 0,
  });
  const products = useMemo(
    () => productsData?.pages?.map((page) => page.products).flat() ?? [],
    [productsData],
  );
  const wishlistItems = useMemo(
    () => buildWishlistItems(wishlist, products),
    [wishlist, products],
  );

  const moveToCart = (product: ProductCardProps) => {
    addToCart(product._id, 1, product.variantId);
    removeFromWishlist(product._id, product.variantId);
    toast.success("Added to cart");
  };

  if (wishlistIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4">
          <Heart className="size-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Your wishlist is empty</h1>
          <p className="text-muted-foreground">
            Start adding products you love to your wishlist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 my-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/products">
                <ArrowLeft />
              </Link>
            </Button>
            <div>
              <p className="text-muted-foreground mt-1">
                {wishlistItems.length} item
                {wishlistItems.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Grid */}
      {!!wishlistItems?.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlistItems.map((product) => {
            const hasDiscount =
              typeof product.oldPrice === "number" &&
              product.oldPrice > product.price;
            const discountPercent = hasDiscount
              ? Math.round(
                  (((product.oldPrice as number) - product.price) /
                    (product.oldPrice as number)) *
                    100,
                )
              : null;

            const stockStatus =
              product.stock === 0 || !product.status
                ? "out"
                : product.stock && product.stock < 10
                  ? "low"
                  : product.stock && product.stock > 20
                    ? "in"
                    : "in";

            const stockBadge =
              stockStatus === "out"
                ? { label: "Out of stock", variant: "destructive" as const }
                : stockStatus === "low"
                  ? { label: "Low stock", variant: "secondary" as const }
                  : { label: "In stock", variant: "default" as const };

            const isOutOfStock = stockStatus === "out";

            return (
              <Card
                key={product._id + (product.variantId ?? "")}
                className="relative overflow-hidden border hover:border-primary/60 hover:shadow-md transition-all pt-0 group"
              >
                {/* Product Card Content */}
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={product.name}
                >
                  <div className="relative">
                    <AspectRatio className="bg-muted">
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </AspectRatio>

                    {/* Badges */}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {discountPercent && (
                        <Badge
                          variant="destructive"
                          className="text-white px-2 py-0.5 text-[10px]"
                        >
                          -{discountPercent}%
                        </Badge>
                      )}
                    </div>
                    <div className="absolute right-2 top-2">
                      <Badge
                        variant={stockBadge.variant}
                        className={cn(
                          "text-[10px] px-2 py-0.5",
                          stockStatus === "low" && "bg-yellow-500 text-white",
                          stockStatus === "in" && "bg-green-500 text-white",
                        )}
                      >
                        {stockBadge.label}
                      </Badge>
                    </div>
                  </div>
                </Link>

                <CardHeader className="px-4 pb-2">
                  <Link href={`/products/${product.slug}`} className="block">
                    <div className="text-xs text-muted-foreground mb-1">
                      <p className="truncate">
                        {product.categoryName}
                        {product.categoryName &&
                          product.subcategoryName &&
                          " · "}
                        {product.subcategoryName}
                      </p>
                    </div>
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary transition-colors mb-1">
                      {product.name}
                      {product.variantLabel && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({product.variantLabel})
                        </span>
                      )}
                    </h3>
                    <div className="mt-1">
                      <span className="font-semibold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && product.oldPrice && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          {formatCurrency(product.oldPrice)}
                        </span>
                      )}
                    </div>
                  </Link>
                </CardHeader>

                <CardFooter className="flex flex-col gap-2 pt-0 -mt-4 px-4">
                  <div className="flex gap-2 w-full">
                    <Button
                      className="flex-1"
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.preventDefault();
                        moveToCart(product);
                      }}
                    >
                      <ShoppingCart className="size-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        removeFromWishlist(product._id, product.variantId)
                      }
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Actions Footer */}
      {!!wishlistItems?.length && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Save items for later or add them to your cart
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  wishlistItems.forEach((item) => {
                    if (item.status && item.stock && item.stock > 0) {
                      moveToCart(item);
                    }
                  });
                }}
              >
                <ShoppingCart className="size-4 mr-2" />
                Add All to Cart
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    confirm("Are you sure you want to clear your wishlist?")
                  ) {
                    clearWishlist();
                  }
                }}
              >
                <Trash2 className="size-4 mr-2" />
                Clear Wishlist
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
