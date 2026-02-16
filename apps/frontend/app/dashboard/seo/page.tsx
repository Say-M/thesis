"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SeoPage() {
  const [openById, setOpenById] = useState("");

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">SEO</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="SEO ID to open"
            className="w-48"
            value={openById}
            onChange={(e) => setOpenById(e.target.value)}
            aria-label="SEO ID"
          />
          <Button asChild variant="outline" disabled={!openById.trim()}>
            <Link
              href={openById.trim() ? `/dashboard/seo/${openById.trim()}` : "#"}
            >
              Open
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-muted-foreground">
          SEO is created or updated per category or product. Use{" "}
          <Link
            href="/dashboard/categories"
            className="text-primary underline underline-offset-4"
          >
            Categories
          </Link>{" "}
          or{" "}
          <Link
            href="/dashboard/products"
            className="text-primary underline underline-offset-4"
          >
            Products
          </Link>{" "}
          → open the row menu → &quot;Add SEO&quot; or &quot;Edit SEO&quot; to
          manage SEO. You can also open an existing SEO by ID above to view or
          delete it (saving requires opening from a category or product).
        </p>
      </div>
    </div>
  );
}
