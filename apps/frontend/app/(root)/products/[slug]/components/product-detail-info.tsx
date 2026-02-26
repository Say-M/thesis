"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Heart, Share2, Minus, Plus, Play } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency-base";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/hooks/api/products";
import { Label } from "@/components/ui/label";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import { toast } from "sonner";

type Variant = ProductDetail["variants"] extends (infer V)[] ? V : never;

type ProductDetailInfoProps = {
  product: ProductDetail;
  discountAmount: number;
  displayPrice: number;
  displayStock: number;
  oldPrice: number | null;
  stockStatus: "in" | "low" | "out";
  selectedVariantId?: string;
  onVariantChange: (variantId?: string) => void;
  quantity: number;
  onQuantityChange: (delta: number) => void;
};

export function ProductDetailInfo({
  product,
  discountAmount,
  displayPrice,
  displayStock,
  oldPrice,
  stockStatus,
  selectedVariantId,
  onVariantChange,
  quantity,
  onQuantityChange,
}: ProductDetailInfoProps) {
  const isOutOfStock = stockStatus === "out";
  const variants = product.hasVariants ? (product.variants ?? []) : [];
  const { addToCart, isInWishlist, toggleWishlist, cart } = useCartWishlist();
  const inWishlist = isInWishlist(product._id, selectedVariantId ?? undefined);

  const selectedVariant = variants.find((v) => v._id === selectedVariantId);

  // Derive business min/max order quantities from variant or product.
  const rawVariantMin =
    typeof selectedVariant?.minQuantity === "number"
      ? selectedVariant?.minQuantity
      : null;
  const rawVariantMax =
    typeof selectedVariant?.maxQuantity === "number"
      ? selectedVariant?.maxQuantity
      : null;
  const rawProductMin =
    typeof product.minQuantity === "number" ? product.minQuantity : null;
  const rawProductMax =
    typeof product.maxQuantity === "number" ? product.maxQuantity : null;

  const minOrderQuantity =
    (rawVariantMin != null && rawVariantMin > 0
      ? rawVariantMin
      : rawProductMin != null && rawProductMin > 0
        ? rawProductMin
        : 1) ?? 1;
  const maxOrderQuantity =
    rawVariantMax != null && rawVariantMax > 0
      ? rawVariantMax
      : rawProductMax != null && rawProductMax > 0
        ? rawProductMax
        : null;

  const effectiveMax = (() => {
    const stockCap = displayStock || 0;
    if (maxOrderQuantity != null && maxOrderQuantity > 0) {
      return Math.min(maxOrderQuantity, stockCap || maxOrderQuantity);
    }
    return stockCap;
  })();

  const displayUnit = selectedVariant?.unit || product.unit || null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product._id, quantity, selectedVariantId ?? undefined);
    toast.success("Added to cart");
  };

  const handleWishlistClick = () => {
    toggleWishlist(product._id, selectedVariantId ?? undefined);
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const isInCart = cart.some(
    (x) => x.productId === product._id && x.variantId === selectedVariantId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {product.category && (
              <>
                <Link
                  href={`/products?category=${product.category._id}`}
                  className="hover:text-foreground"
                >
                  {product.category.name}
                </Link>
                {product.subcategory && (
                  <>
                    {" · "}
                    <Link
                      href={`/products?category=${product.subcategory._id}`}
                      className="hover:text-foreground"
                    >
                      {product.subcategory.name}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          {product?.isFreeShipping && (
            <Badge className="text-background bg-green-600 dark:bg-green-400 dark:text-foreground">
              Free Shipping
            </Badge>
          )}
          <Badge
            variant={
              stockStatus === "out"
                ? "destructive"
                : stockStatus === "low"
                  ? "secondary"
                  : "default"
            }
            className={cn(
              stockStatus === "low" && "bg-yellow-500 text-white",
              stockStatus === "in" && "bg-green-500 text-white",
            )}
          >
            {stockStatus === "out"
              ? "Out of stock"
              : stockStatus === "low"
                ? "Low stock"
                : "In stock"}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(displayPrice)}
          </span>
          {oldPrice != null && oldPrice > displayPrice && (
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(oldPrice)}
            </span>
          )}
          {discountAmount > 0 && (
            <Badge variant="destructive">
              -{formatCurrency(discountAmount)} OFF
            </Badge>
          )}
        </div>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <Label>Select Variant</Label>
          <Select
            value={selectedVariantId ?? variants[0]?._id ?? ""}
            onValueChange={(v) => onVariantChange(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants?.map((variant) => (
                <SelectItem
                  key={variant._id}
                  value={variant._id}
                  disabled={!variant.status || (variant.stock ?? 0) === 0}
                >
                  {variant.name}
                  {(variant.stock ?? 0) === 0 && " (Out of stock)"}
                  {(variant.stock ?? 0) > 0 &&
                    (variant.stock ?? 0) < 10 &&
                    " (Low stock)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(-1)}
              disabled={quantity <= minOrderQuantity}
            >
              <Minus className="size-4" />
            </Button>
            <Input
              type="number"
              min={minOrderQuantity}
              max={effectiveMax || displayStock}
              value={quantity}
              onChange={(e) => {
                const raw = parseInt(e.target.value);
                const maxCap = effectiveMax || displayStock;
                const minCap = minOrderQuantity;
                const val = Number.isFinite(raw) ? raw : minCap;
                const clamped = Math.min(
                  Math.max(minCap, val),
                  maxCap || minCap,
                );
                onQuantityChange(clamped - quantity);
              }}
              className="w-20 text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onQuantityChange(1)}
              disabled={
                effectiveMax
                  ? quantity >= effectiveMax
                  : quantity >= displayStock
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            size="lg"
            disabled={isOutOfStock || isInCart}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="size-5 mr-2" />
            {isOutOfStock
              ? "Out of Stock"
              : isInCart
                ? "Added to Cart"
                : "Add to Cart"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleWishlistClick}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(inWishlist && "text-destructive!")}
          >
            <Heart className={cn("size-5", inWishlist && "fill-current")} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              navigator.share?.({
                title: product.name,
                text: product.name,
                url: typeof window !== "undefined" ? window.location.href : "",
              });
            }}
            aria-label="Share"
          >
            <Share2 className="size-5" />
          </Button>
        </div>
      </div>

      {product.videoLink && (
        <Button variant="outline" className="w-full" asChild>
          <a href={product.videoLink} target="_blank" rel="noopener noreferrer">
            <Play className="size-4 mr-2" />
            Watch Product Video
          </a>
        </Button>
      )}
      {/* <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="flex items-center gap-3">
          <Truck className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Free Shipping</p>
            <p className="text-xs text-muted-foreground">
              On orders over ৳2000
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Secure Payment</p>
            <p className="text-xs text-muted-foreground">
              100% secure checkout
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RotateCcw className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Easy Returns</p>
            <p className="text-xs text-muted-foreground">
              30-day return policy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Check className="size-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Quality Assured</p>
            <p className="text-xs text-muted-foreground">
              Premium quality products
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
