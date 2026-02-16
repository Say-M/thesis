"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heart, Trash2, ShoppingCart, ArrowLeft, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency-base";
import { cn } from "@/lib/utils";
import type { ProductCardProps } from "../common/product-card";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";
import { toast } from "sonner";

function toCardProps(p: ProductDetail): ProductCardProps {
  const { price, oldPrice, stock } = productListItemToCardProps(p);
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
  };
}

export default function WishlistPage() {
  const { wishlistIds, removeFromWishlist, addToCart, clearWishlist } =
    useCartWishlist();
  const { data: productsData, isLoading } = useListProducts({
    productIds: wishlistIds,
    enabled: wishlistIds.length > 0,
  });
  const products = useMemo(() => productsData?.pages?.map((page) => page.products).flat() ?? [], [productsData]);
  const wishlistItems = useMemo(() => products.map(toCardProps), [products]);

  const moveToCart = (product: ProductCardProps) => {
    addToCart(product._id, 1);
    removeFromWishlist(product._id);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {wishlistItems?.map((product) => (
          <Card key={product._id} className="relative group">
            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={() => removeFromWishlist(product._id)}
              aria-label="Remove from wishlist"
            >
              <Trash2 className="size-4" />
            </Button>

            {/* Product Card Content */}
            <div className="relative">
              <Link
                href={`/products/${product.slug}`}
                aria-label={product.name}
              >
                <div className="relative">
                  <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {product.featured && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-2 py-0.5"
                      >
                        Featured
                      </Badge>
                    )}
                    {product.oldPrice && product.oldPrice > product.price && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-2 py-0.5 bg-red-600 text-white"
                      >
                        -
                        {Math.round(
                          ((product.oldPrice - product.price) /
                            product.oldPrice) *
                            100,
                        )}
                        %
                      </Badge>
                    )}
                  </div>
                  <div className="absolute right-2 top-2">
                    <Badge
                      variant={
                        product.stock === 0
                          ? "destructive"
                          : product.stock && product.stock < 10
                            ? "secondary"
                            : "default"
                      }
                      className={cn(
                        "text-[10px] px-2 py-0.5",
                        product.stock === 0 &&
                          "bg-destructive text-destructive-foreground",
                        product.stock &&
                          product.stock < 10 &&
                          "bg-yellow-500 text-white",
                        product.stock &&
                          product.stock > 20 &&
                          "bg-green-500 text-white",
                      )}
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : product.stock && product.stock < 10
                          ? "Low stock"
                          : "In stock"}
                    </Badge>
                  </div>
                </div>
              </Link>

              <CardHeader className="pb-2">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="text-xs text-muted-foreground mb-1">
                    {product.categoryName}
                    {product.categoryName && product.subcategoryName && " · "}
                    {product.subcategoryName}
                  </div>
                  <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-1">
                    <span className="font-semibold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatCurrency(product.oldPrice)}
                      </span>
                    )}
                  </div>
                </Link>
              </CardHeader>

              <CardFooter className="pt-0 pb-4">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={!product.status || product.stock === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    moveToCart(product);
                  }}
                >
                  <ShoppingCart className="size-4 mr-2" />
                  Add to Cart
                </Button>
              </CardFooter>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions Footer */}
      {wishlistItems.length > 0 && (
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
