"use client";

import { useConfigContext } from "@/contexts/config";
import { useListPages } from "@/hooks/api/pages";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const SOCIAL_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

/** Group pages by tag for footer columns (tag → list of pages). */
function groupPagesByTag<
  T extends { _id: string; title: string; slug: string; tag?: string | null },
>(pages: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const page of pages) {
    const tag = (page.tag ?? "Other").trim() || "Other";
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(page);
  }
  return grouped;
}

export default function Footer() {
  const { config } = useConfigContext();
  const { data: footerPagesData } = useListPages({
    status: "true",
    showInFooter: "true",
    limit: 50,
  });
  const footerPages =
    footerPagesData?.pages?.map((page) => page.pages).flat() ?? [];
  const footerPagesByTag = groupPagesByTag(footerPages);
  const tagKeys = Object.keys(footerPagesByTag).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  const hasLinkColumns = tagKeys.length > 0;

  return (
    <footer className="bg-muted/30 border-t mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Main Footer Content */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-8 py-12 ${hasLinkColumns ? "lg:grid-cols-6" : "lg:grid-cols-5"}`}
        >
          {/* Company Info (from config) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <h2 className="text-2xl font-bold">
                {config?.siteName?.trim() || "DesignBookBD"}
              </h2>
            </Link>
            {(config?.siteDescription?.trim() ?? "").length > 0 && (
              <p className="text-sm text-muted-foreground max-w-md">
                {config?.siteDescription}
              </p>
            )}

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              {config?.siteEmail?.trim() && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <a
                    href={`mailto:${config.siteEmail}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {config.siteEmail}
                  </a>
                </div>
              )}
              {config?.sitePhone?.trim() && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <a
                    href={`tel:${config.sitePhone.replace(/\s/g, "")}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {config.sitePhone}
                  </a>
                </div>
              )}
              {config?.siteAddress?.trim() && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="size-4 shrink-0 mt-0.5" />
                  <span>{config.siteAddress}</span>
                </div>
              )}
            </div>

            {/* Social Media (from config.socials) */}
            {config?.socials && Object.keys(config.socials).length > 0 && (
              <div className="flex items-center gap-3">
                {Object.entries(config.socials).map(([key, item]) => {
                  const url = item?.url?.trim();
                  if (!url) return null;
                  const Icon =
                    SOCIAL_ICON_MAP[key.toLowerCase()] ??
                    SOCIAL_ICON_MAP[key.toLowerCase().replace(/\s/g, "")];
                  const name = item?.name?.trim() || key;
                  if (!Icon) return null;
                  return (
                    <Button
                      key={key}
                      variant="ghost"
                      size="icon-sm"
                      asChild
                      aria-label={name}
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Icon className="size-4" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer page links grouped by tag (like Shop, Categories, About) */}
          {tagKeys.map((tag) => (
            <div key={tag}>
              <h3 className="font-semibold mb-4">{tag}</h3>
              <ul className="space-y-2 text-sm">
                {footerPagesByTag[tag].map((page) => (
                  <li key={page._id}>
                    <Link
                      href={`/${page.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Features Bar */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Truck className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">On orders over ৳2000</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-muted-foreground">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <HeadphonesIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">24/7 Support</p>
              <p className="text-xs text-muted-foreground">We're here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Easy Returns</p>
              <p className="text-xs text-muted-foreground">30-day return policy</p>
            </div>
          </div>
        </div> */}

        {/* Newsletter */}
        {/* <div className="my-8 border-t">
          <div className="max-w-md">
            <h3 className="font-semibold mb-2">Subscribe to our newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest updates on new products and upcoming sales.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div> */}

        <Separator />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>
              © {new Date().getFullYear()}{" "}
              {config?.siteName?.trim() || "DesignBookBD"}. All rights reserved.
            </span>
            <Separator orientation="vertical" className="h-3" />
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Separator orientation="vertical" className="h-3" />
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          {/* Payment Methods */}
          {/* <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">We accept:</span>
            <div className="flex items-center gap-2">
              {paymentMethods.map((method, idx) => (
                <span
                  key={idx}
                  className="text-lg"
                  title={method.name}
                  aria-label={method.name}
                >
                  {method.icon}
                </span>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
