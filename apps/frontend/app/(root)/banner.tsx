"use client";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useListBanners, type BannerListItem } from "@/hooks/api/banners";
import { Skeleton } from "@/components/ui/skeleton";

export default function Banner() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const {
    data: bannersData,
    status: bannersStatus,
    fetchNextPage: fetchNextBannersPage,
    isFetchingNextPage: isFetchingNextBannersPage,
  } = useListBanners({
    status: "true",
    all: "true",
  });

  const banners = useMemo(
    () => bannersData?.pages?.map((page) => page.banners).flat() ?? [],
    [bannersData],
  );
  const count = banners.length;

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api, count]);

  if (isFetchingNextBannersPage || bannersStatus === "pending") {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <AspectRatio ratio={16 / 9}>
          <Skeleton className="size-full" />
        </AspectRatio>
      </section>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      <Carousel setApi={setApi} className="relative">
        <CarouselContent>
          {banners.map((banner) => {
            const imagePath = banner?.image?.path;
            const inner = (
              <AspectRatio ratio={16 / 9}>
                <div className="size-full bg-muted">
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt={banner?.title ?? "Banner"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <span className="text-muted-foreground">
                        {banner?.title ?? "Banner"}
                      </span>
                    </div>
                  )}
                </div>
              </AspectRatio>
            );
            return (
              <CarouselItem key={banner._id}>
                {banner?.link?.trim() ? (
                  <Link
                    href={banner?.link ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {count > 1 && (
          <div className="absolute bottom-4 left-8 flex items-center gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "size-2 rounded-full cursor-pointer transition-colors",
                  current === index + 1
                    ? "bg-primary"
                    : "bg-muted hover:bg-muted/80",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}
