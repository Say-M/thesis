import type { Metadata } from "next";
import { getPageBySlug, getSeoByTypeId } from "./data";
import { PageDetailClient } from "./page-detail-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) {
    return { title: "Page not found" };
  }

  const seo = await getSeoByTypeId(page._id, "page");
  const title = seo?.metaTitle?.trim() || page.title;
  const description = seo?.metaDescription?.trim() || undefined;
  const ogImage =
    (seo?.ogImage as { path?: string } | undefined)?.path ||
    (page.featuredImage &&
    typeof page.featuredImage === "object" &&
    "path" in page.featuredImage
      ? page.featuredImage.path
      : undefined);
  const twitterImage =
    (seo?.twitterImage as { path?: string } | undefined)?.path || ogImage;

  const baseUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "";
  const canonical = seo?.canonicalUrl?.trim() || (baseUrl ? `${baseUrl}/${page.slug ?? slug}` : undefined);

  const robots =
    seo?.noindex === true || seo?.nofollow === true
      ? {
          index: !seo.noindex,
          follow: !seo.nofollow,
        }
      : undefined;

  return {
    title,
    description,
    keywords: seo?.metaKeywords?.trim() || undefined,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title: seo?.ogTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || description,
      type: (seo?.ogType?.trim() as "website" | "article") || "website",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: (seo?.twitterCard?.trim() as "summary" | "summary_large_image") || "summary_large_image",
      title: seo?.twitterTitle?.trim() || title,
      description: seo?.twitterDescription?.trim() || description,
      ...(twitterImage && { images: [{ url: twitterImage }] }),
    },
  };
}

export default async function PageBySlugPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  return <PageDetailClient slug={slug} page={page} />;
}
