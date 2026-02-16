import type { Metadata } from "next";
import { getCategoryById, getSeoByTypeId } from "./data";
import ProductsListingClient from "./products-listing-client";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{
    category?: string;
    search?: string;
    featured?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const categoryId = params?.category?.trim();
  if (!categoryId) {
    return {
      title: "Products",
      description: "Discover our complete collection of quality products",
    };
  }

  const [category, seo] = await Promise.all([
    getCategoryById(categoryId),
    getSeoByTypeId(categoryId, "category"),
  ]);

  if (!category) {
    return {
      title: "Products",
      description: "Discover our complete collection of quality products",
    };
  }

  const title = seo?.metaTitle?.trim() || `Products - ${category.name}`;
  const description =
    seo?.metaDescription?.trim() ||
    category.description?.trim() ||
    `Browse products in ${category.name}.`;

  const siteUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : undefined;
  const canonical =
    seo?.canonicalUrl?.trim() ||
    (siteUrl
      ? `${siteUrl}/products?category=${encodeURIComponent(categoryId)}`
      : undefined);

  const robots =
    seo?.noindex === true || seo?.nofollow === true
      ? { index: !seo.noindex, follow: !seo.nofollow }
      : undefined;

  const ogImage = (seo?.ogImage as { path?: string } | undefined)?.path;
  const twitterImage = (seo?.twitterImage as { path?: string } | undefined)
    ?.path;

  return {
    title,
    description,
    keywords: seo?.metaKeywords?.trim() || undefined,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title: seo?.ogTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || description,
      type: (seo?.ogType?.trim() as "website" | undefined) || "website",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card:
        (seo?.twitterCard?.trim() as "summary_large_image" | undefined) ||
        "summary_large_image",
      title: seo?.twitterTitle?.trim() || title,
      description: seo?.twitterDescription?.trim() || description,
      ...(twitterImage && { images: [{ url: twitterImage }] }),
    },
  };
}

export default async function ProductsPage() {
  return (
    <Suspense>
      <ProductsListingClient />
    </Suspense>
  );
}
