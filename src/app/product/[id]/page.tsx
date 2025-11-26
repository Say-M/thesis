import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { ProductPageClient } from "./product-page-client";
import { getProductById, getProductsByCategory } from "@/data/mock-content";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return (
      <>
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Product not found</h1>
            <Button asChild className="mt-4">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const relatedProducts = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ProductPageClient product={product} relatedProducts={relatedProducts} />
      </main>
    </>
  );
}

