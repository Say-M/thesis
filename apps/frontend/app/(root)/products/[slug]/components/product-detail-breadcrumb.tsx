"use client";

import Link from "next/link";

type ProductDetailBreadcrumbProps = {
  productName: string;
};

export function ProductDetailBreadcrumb({
  productName,
}: ProductDetailBreadcrumbProps) {
  return (
    <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      <span className="mx-2">/</span>
      <Link href="/products" className="hover:text-foreground">
        Products
      </Link>
      <span className="mx-2">/</span>
      <span className="text-foreground">{productName}</span>
    </nav>
  );
}
