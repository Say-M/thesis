"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency-base";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import { toast } from "sonner";

export type ProductCardProps = {
  _id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  categoryName?: string;
  subcategoryName?: string;
  price: number;
  oldPrice?: number | null;
  featured?: boolean;
  status?: boolean;
  stock?: number;
  hasVariants?: boolean;
  variantId?: string;
};

export default function ProductCard({
  _id,
  name,
  slug,
  thumbnailUrl,
  categoryName,
  subcategoryName,
  price,
  oldPrice,
  status = true,
  stock = 0,
  hasVariants = false,
  variantId,
}: ProductCardProps) {
  const hasDiscount = oldPrice && oldPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : null;

  // Stock badge logic
  const stockStatus =
    stock === 0 || !status
      ? "out"
      : stock < 10
        ? "low"
        : stock > 20
          ? "in"
          : "in"; // Default to "in" for stock between 10-20

  const stockBadge =
    stockStatus === "out"
      ? { label: "Out of stock", variant: "destructive" as const }
      : stockStatus === "low"
        ? { label: "Low stock", variant: "secondary" as const }
        : { label: "In stock", variant: "default" as const };

  const isOutOfStock = stockStatus === "out";
  const { addToCart, isInWishlist, toggleWishlist, cart } = useCartWishlist();
  const inWishlist = isInWishlist(_id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(_id, 1, variantId);
    toast.success("Added to cart");
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(_id);
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const isInCart = cart.some(
    (x) => x.productId === _id && x.variantId === variantId,
  );

  return (
    <Card className="relative overflow-hidden border hover:border-primary/60 hover:shadow-md transition-all pt-0">
      <Link href={`/products/${slug}`} aria-label={name}>
        <div className="relative">
          <AspectRatio className="bg-muted">
            <img
              src={thumbnailUrl}
              alt={name}
              className="size-full object-cover"
              loading="lazy"
            />
          </AspectRatio>

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discountPercent && (
              <Badge variant="destructive" className="text-white">
                -{discountPercent}%
              </Badge>
            )}
          </div>
          <div className="absolute right-2 top-2">
            <Badge
              variant={stockBadge.variant}
              className={cn(
                "px-2 py-0.5",
                stockStatus === "low" && "bg-yellow-500 text-white",
                stockStatus === "in" && "bg-green-500 text-white",
              )}
            >
              {stockBadge.label}
            </Badge>
          </div>
        </div>
      </Link>

      <CardHeader className="px-4">
        <Link href={`/products/${slug}`} className="block">
          <div className="text-xs text-muted-foreground">
            <p className="truncate">
              {categoryName}
              {categoryName && subcategoryName && " · "}
              {subcategoryName}
            </p>
          </div>
          <CardTitle className="text-base leading-snug line-clamp-2 mb-1 hover:text-primary transition-colors">
            {name}
          </CardTitle>
          <CardDescription>
            {hasVariants && (
              <span className="text-xs text-muted-foreground mr-1">From </span>
            )}
            <span className="font-semibold text-primary">
              {formatCurrency(price)}
            </span>
            {hasDiscount && oldPrice && (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {formatCurrency(oldPrice)}
              </span>
            )}
          </CardDescription>
        </Link>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2 pt-0 -mt-4 px-4">
        <div className="flex gap-2 w-full">
          <Button
            className="flex-1"
            disabled={isOutOfStock || isInCart}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="size-4 mr-2" />
            {isInCart ? "Added to cart" : "Add to cart"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleWishlistClick}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(inWishlist && "text-destructive")}
          >
            <Heart className={cn("size-4", inWishlist && "fill-current")} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
