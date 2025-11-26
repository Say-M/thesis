"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "AI Agent", href: "/agent" },
      { label: "Categories", href: "/categories" },
      { label: "Cart", href: "/cart" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Careers", href: "/" },
      { label: "Press", href: "/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/" },
      { label: "Blog", href: "/" },
      { label: "Support", href: "/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">AI Commerce</h3>
            <p className="text-sm text-muted-foreground">
              Platform-agnostic storefront with a built-in AI shopping agent.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <span aria-hidden>𝕏</span>
              </Button>
              <Button variant="ghost" size="icon">
                in
              </Button>
              <Button variant="ghost" size="icon">
                Ⓕ
              </Button>
            </div>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} AI Commerce. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/">Privacy</Link>
            <Link href="/">Terms</Link>
            <Link href="/">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
