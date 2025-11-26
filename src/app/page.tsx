import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { ProductCard } from "@/components/product-card";
import {
  categories,
  getFeaturedProducts,
  getBestSellingProducts,
} from "@/data/mock-content";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { HeroCarousel, HeroSlide } from "@/components/hero-carousel";

export default function Home() {
  const featuredProducts = getFeaturedProducts();
  const bestSelling = getBestSellingProducts();
  const bannerSlides: HeroSlide[] = [
    {
      eyebrow: "New drop",
      title: "Spring essentials curated by AI",
      description:
        "Real-time product summaries, trending picks, and instant comparisons tailored to every customer.",
      cta: "Browse categories",
      href: "/categories",
      accent: "from-primary/20 via-white to-secondary/30",
    },
    {
      eyebrow: "Conversational checkout",
      title: "Let the agent build your cart",
      description:
        "Customers can ask for alternatives, compare devices, and add to cart directly from the chat.",
      cta: "Chat with assistant",
      href: "/agent",
      accent: "from-secondary/30 via-white to-primary/10",
    },
    {
      eyebrow: "Ops ready",
      title: "Track, summarize, and upsell",
      description:
        "Order tracking timelines, review summaries, and cart insights—no backend required.",
      cta: "View profile",
      href: "/profile",
      accent: "from-[#f7e7ff] via-white to-primary/5",
    },
  ];

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <HeroCarousel slides={bannerSlides} />

        {/* Featured Categories */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Shop by Category</h2>
            <Button asChild variant="ghost">
              <Link href="/categories">View All</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                <Card className="h-full transition-all hover:shadow-lg">
                  <CardHeader>
                    <CardTitle>{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {category.subcategories && (
                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.slice(0, 3).map((sub) => (
                          <Badge key={sub.slug} variant="secondary">
                            {sub.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Featured Products</h2>
            <Button asChild variant="ghost">
              <Link href="/categories">View All</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Best Selling */}
        <section className="mb-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold">Best Sellers</h2>
              <p className="text-sm text-muted-foreground">
                Top-performing items pulling in the highest engagement.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/categories">View All</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bestSelling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
