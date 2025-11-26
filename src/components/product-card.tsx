"use client";

import { Product } from "@/data/mock-content";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/context/agent-context";
import Link from "next/link";
import { getPriceDisplay } from "@/lib/pricing";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const { addToCart } = useAgent();
  const price = getPriceDisplay(product);

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">
            {product.title}
          </CardTitle>
          <Badge variant="secondary" className="capitalize">
            {product.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Link href={`/product/${product.id}`} className="relative">
          <div className="flex mb-2 h-48 items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground transition-all hover:bg-muted/50">
            Image placeholder
          </div>
          {price.discountPercent && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              -{price.discountPercent}%
            </Badge>
          )}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground mb-2">
          {product.description}
        </p>
        {product.rating && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{product.rating}</span>
            <span className="text-muted-foreground">
              ({product.reviews} reviews)
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-3">
        <div>
          {price.previous && (
            <p className="text-sm text-muted-foreground line-through">
              {price.previous}
            </p>
          )}
          <p className="text-lg font-semibold">{price.current}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/product/${product.id}`}>View</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
