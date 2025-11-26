import { Navigation } from "@/components/navigation";
import { ProductCard } from "@/components/product-card";
import {
  categories,
  getProductsByCategory,
} from "@/data/mock-content";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ category: string; sub: string }>;
};

export default async function SubcategoryPage({ params }: Props) {
  const { category: categorySlug, sub: subcategorySlug } = await params;
  const category = categories.find((c) => c.slug === categorySlug);
  const subcategory = category?.subcategories?.find(
    (s) => s.slug === subcategorySlug
  );
  const products = getProductsByCategory(categorySlug, subcategorySlug);

  if (!category || !subcategory) {
    return (
      <>
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Subcategory not found</h1>
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
          <div className="flex items-center gap-2 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href="/categories">Categories</Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/categories/${categorySlug}`}>{category.name}</Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{subcategory.name}</span>
          </div>
          <h1 className="text-4xl font-semibold">{subcategory.name}</h1>
          <p className="text-muted-foreground">
            Products in {category.name} &gt; {subcategory.name}
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products.length} products found
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">
              No products found in this subcategory.
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

