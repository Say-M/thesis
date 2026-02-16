import type { Metadata } from "next";
import { getProductBySlug, getSeoByTypeId } from "./data";
import { ProductDetailClient } from "./product-detail-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }

  const seo = await getSeoByTypeId(product._id, "product");
  const title = seo?.metaTitle?.trim() || product.name;
  const description =
    seo?.metaDescription?.trim() || product.description?.trim() || undefined;
  const ogImage =
    (seo?.ogImage as { path?: string } | undefined)?.path ||
    product.thumbnail?.path ||
    product.images?.[0]?.path;
  const twitterImage =
    (seo?.twitterImage as { path?: string } | undefined)?.path ||
    product.thumbnail?.path ||
    product.images?.[0]?.path;

  const canonical =
    seo?.canonicalUrl?.trim() ||
    (typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/products/${product.slug ?? slug}`
      : undefined);

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
      type: (seo?.ogType?.trim() as any) || "website",
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: (seo?.twitterCard?.trim() as any) || "summary_large_image",
      title: seo?.twitterTitle?.trim() || title,
      description: seo?.twitterDescription?.trim() || description,
      ...(twitterImage && { images: [{ url: twitterImage }] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const seo = product ? await getSeoByTypeId(product._id, "product") : null;

  return (
    <ProductDetailClient slug={slug} product={product} seo={seo} />
  );
}
