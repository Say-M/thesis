"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageItem = { _id: string; path: string };

type ProductDetailGalleryProps = {
  images: ImageItem[];
  productName: string;
  videoLink?: string | null;
};

export function ProductDetailGallery({
  images,
  productName,
  videoLink,
}: ProductDetailGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (api) api.scrollTo(selectedIndex);
  }, [api, selectedIndex]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg border bg-muted overflow-hidden">
        {hasImages ? (
          <Carousel
            className="w-full h-full"
            opts={{ startIndex: selectedIndex }}
            setApi={(carouselApi) => {
              setApi(carouselApi ?? null);
              carouselApi?.on("select", () =>
                setSelectedIndex(carouselApi.selectedScrollSnap()),
              );
            }}
          >
            <CarouselContent className="h-full">
              {images.map((img, idx) => (
                <CarouselItem key={img._id} className="h-full">
                  <div className="relative w-full h-full">
                    <img
                      src={img.path}
                      alt={`${productName} - Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              key={img._id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative aspect-square rounded-md border-2 overflow-hidden transition-all",
                selectedIndex === idx
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/50",
              )}
            >
              <img
                src={img.path}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {videoLink && (
        <Button variant="outline" className="w-full" asChild>
          <a
            href={videoLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Play className="size-4 mr-2" />
            Watch Product Video
          </a>
        </Button>
      )}
    </div>
  );
}
