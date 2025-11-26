import { Navigation } from "@/components/navigation";
import { ProductCard } from "@/components/product-card";
import {
  categories,
  getProductsByCategory,
} from "@/data/mock-content";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = categories.find((c) => c.slug === categorySlug);
  const products = getProductsByCategory(categorySlug);

  if (!category) {
    return (
      <>
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Category not found</h1>
            <Button asChild className="mt-4">
              <Link href="/categories">Back to Categories</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/categories">Categories</Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{category.name}</span>
          </div>
          <h1 className="text-4xl font-semibold">{category.name}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>

        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <Button
                key={sub.slug}
                asChild
                variant="outline"
                size="sm"
              >
                <Link href={`/categories/${categorySlug}/${sub.slug}`}>
                  {sub.name}
                </Link>
              </Button>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length} products found
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">
              No products found in this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

