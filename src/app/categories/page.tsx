import { Navigation } from "@/components/navigation";
import { CategoryCard } from "@/components/category-card";
import { categories } from "@/data/mock-content";

export default function CategoriesPage() {
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-semibold">All Categories</h1>
          <p className="text-muted-foreground">
            Browse our complete selection of products organized by category.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </main>
    </>
  );
}

