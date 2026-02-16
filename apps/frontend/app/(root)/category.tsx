"use client";

import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useListCategories } from "@/hooks/api/categories";

export default function Category() {
  const { data, status, isFetchingNextPage } = useListCategories({
    status: "true",
    featured: "true",
    all: "true",
  });

  if (isFetchingNextPage || status === "pending") {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 my-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-lg overflow-hidden animate-pulse"
            >
              <AspectRatio ratio={1}>
                <div className="size-full bg-muted" />
              </AspectRatio>
              <div className="border-t h-10 bg-muted/50" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (data?.pages?.[0]?.categories?.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
        {data?.pages?.map((page) =>
          page?.categories?.map((cat) => (
            <Link
              key={cat._id}
              href={`/products?category=${cat._id}`}
              className="border rounded-lg overflow-hidden hover:border-primary/60 hover:shadow-md transition-all"
            >
              <AspectRatio ratio={1}>
                <div className="size-full bg-muted">
                  {cat.thumbnail?.path ? (
                    <img
                      src={cat.thumbnail.path}
                      alt={cat.name ?? ""}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center size-full text-muted-foreground text-2xl font-medium">
                      {cat.name?.charAt(0)?.toUpperCase() ?? "—"}
                    </span>
                  )}
                </div>
              </AspectRatio>
              <p className="border-t text-center py-2 px-1 text-sm font-medium">
                {cat.name}
              </p>
            </Link>
          )),
        )}
      </div>
    </section>
  );
}
