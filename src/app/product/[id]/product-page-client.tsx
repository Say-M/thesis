"use client";

import { Product, getProductReviews } from "@/data/mock-content";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAgent } from "@/context/agent-context";
import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { getPriceDisplay } from "@/lib/pricing";

type Props = {
  product: Product;
  relatedProducts: Product[];
};

export function ProductPageClient({ product, relatedProducts }: Props) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "positive" | "critical"
  >("all");
  const { addToCart, sendMessage, messages } = useAgent();
  const reviews = getProductReviews(product.id);
  const price = getPriceDisplay(product);

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === "positive") return review.rating >= 4;
    if (reviewFilter === "critical") return review.rating <= 3;
    return true;
  });

  const handleChatSubmit = (input: string) => {
    sendMessage(`Tell me about ${product.title}. ${input}`);
  };

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Home</Link>
        </Button>
        <span className="mx-2 text-muted-foreground">/</span>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/categories/${product.category}`}>
            {product.category}
          </Link>
        </Button>
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="flex h-96 items-center justify-center rounded-xl border border-dashed bg-muted/50">
          <p className="text-muted-foreground">Product Image Placeholder</p>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
              {product.subcategory && (
                <Badge variant="outline" className="capitalize">
                  {product.subcategory}
                </Badge>
              )}
            </div>
            <h1 className="mb-2 text-4xl font-semibold">{product.title}</h1>
            <div className="flex items-center gap-2">
              {product.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            {price.previous && (
              <p className="text-muted-foreground line-through">
                {price.previous}
              </p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{price.current}</p>
              {price.discountPercent && (
                <Badge variant="destructive">
                  Save {price.discountPercent}%
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => addToCart(product)}
            >
              Add to Cart
            </Button>
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask AI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ask about {product.title}</DialogTitle>
                  <DialogDescription>
                    Get product information, comparisons, and recommendations
                    from our AI assistant.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex max-h-[60vh] flex-col gap-4">
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Start a conversation about this product...
                      </p>
                    )}
                  </div>
                  <ChatInput onSubmit={handleChatSubmit} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mb-12 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Customer Reviews</h2>
              <p className="text-sm text-muted-foreground">
                Showing {filteredReviews.length} of {reviews.length} reviews
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "positive", label: "Positive (4★+)" },
                { id: "critical", label: "Critical (3★-)" },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={reviewFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setReviewFilter(filter.id as typeof reviewFilter)
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">
                      {review.rating}.0
                    </span>
                  </div>
                  {review.highlighted && (
                    <Badge variant="secondary">Top mention</Badge>
                  )}
                </div>
                <h3 className="text-base font-semibold">{review.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.comment}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{review.author}</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {filteredReviews.length === 0 && (
              <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
                No reviews found for this filter.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-semibold">Related Products</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
