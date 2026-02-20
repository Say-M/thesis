"use client";

import { useConfigContext } from "@/contexts/config";
import { useListPages } from "@/hooks/api/pages";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const SOCIAL_KEYS = {
  facebook: `<svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="currentColor"
        style="color: #1877f2"
        viewBox="0 0 24 24"
      >
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
      </svg>`,
  twitter: `<svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="currentColor"
        style="color: #1da1f2"
        viewBox="0 0 24 24"
      >
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
      </svg>`,
  instagram: `<svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="currentColor"
        style="color: #c13584"
        viewBox="0 0 24 24"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>`,
  youtube: `<svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="currentColor"
        style="color: #ff0000"
        viewBox="0 0 24 24"
      >
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>`,
  whatsapp: `<svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        fill="currentColor"
        style="color: #128c7e"
        viewBox="0 0 24 24"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>`,
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
    all: "true",
  });
  const footerPages =
    footerPagesData?.pages?.map((page) => page.pages).flat() ?? [];
  const footerPagesByTag = groupPagesByTag(footerPages);
  const tagKeys = Object.keys(footerPagesByTag).sort((a, b) =>
    b.localeCompare(a, undefined, { sensitivity: "base" }),
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
                  const name = item?.name?.trim() || key;
                  return (
                    <Button
                      key={key}
                      variant="secondary"
                      size="icon-sm"
                      asChild
                      aria-label={name}
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <span
                          dangerouslySetInnerHTML={{
                            __html:
                              SOCIAL_KEYS[key as keyof typeof SOCIAL_KEYS],
                          }}
                        />
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
              href="/privacy-policy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Separator orientation="vertical" className="h-3" />
            <Link
              href="/terms-of-service"
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
