import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TanStackProvider from "@/contexts/tanstack";
import AuthProvider from "@/contexts/auth";
import ConfigProvider from "@/contexts/config";
import { CartWishlistProvider } from "@/contexts/cart-wishlist";
import { Toaster } from "sonner";
import { getConfig } from "./data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  const seo = config?.seo;

  const siteName = config?.siteName?.trim() || "My Store";
  const siteDescription =
    seo?.metaDescription?.trim() ||
    config?.siteDescription?.trim() ||
    undefined;
  const siteUrl = config?.siteUrl?.trim() || undefined;

  const title = seo?.metaTitle?.trim() || siteName;
  const ogImage =
    (seo?.ogImage as { path?: string } | undefined)?.path ||
    (config?.siteLogo &&
    typeof config.siteLogo === "object" &&
    "path" in config.siteLogo
      ? config.siteLogo.path
      : undefined);
  const twitterImage =
    (seo?.twitterImage as { path?: string } | undefined)?.path || ogImage;

  const baseUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : siteUrl || "";
  const canonical =
    seo?.canonicalUrl?.trim() || (baseUrl ? baseUrl : undefined);

  const robots =
    seo?.noindex === true || seo?.nofollow === true
      ? {
          index: !seo.noindex,
          follow: !seo.nofollow,
        }
      : undefined;

  return {
    title,
    description: siteDescription,
    keywords: seo?.metaKeywords?.trim() || undefined,
    alternates: canonical ? { canonical } : undefined,
    robots,
    openGraph: {
      title: seo?.ogTitle?.trim() || title,
      description: seo?.ogDescription?.trim() || siteDescription,
      type: (seo?.ogType?.trim() as "website" | "article") || "website",
      siteName,
      ...(ogImage && { images: [{ url: ogImage }] }),
      ...(siteUrl && { url: siteUrl }),
    },
    twitter: {
      card:
        (seo?.twitterCard?.trim() as
          | "summary"
          | "summary_large_image"
          | "app"
          | "player") || "summary_large_image",
      title: seo?.twitterTitle?.trim() || title,
      description: seo?.twitterDescription?.trim() || siteDescription,
      ...(twitterImage && { images: [{ url: twitterImage }] }),
    },
    ...(config?.siteFavicon &&
      typeof config.siteFavicon === "object" &&
      "path" in config.siteFavicon && {
        icons: {
          icon: config.siteFavicon.path,
          shortcut: config.siteFavicon.path,
          apple: config.siteFavicon.path,
        },
      }),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanStackProvider>
          <AuthProvider>
            <ConfigProvider>
              <CartWishlistProvider>
                <Toaster />
                {children}
              </CartWishlistProvider>
            </ConfigProvider>
          </AuthProvider>
        </TanStackProvider>
      </body>
    </html>
  );
}
