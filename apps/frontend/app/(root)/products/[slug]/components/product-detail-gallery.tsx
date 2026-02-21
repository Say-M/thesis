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
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ImageZoom } from "@/components/animate-ui/primitives/effects/image-zoom";

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

  const hasImages = images.length > 0;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg border bg-muted overflow-hidden">
        {hasImages ? (
          <ImageZoom>
            <AspectRatio className="relative">
              <Image
                fill
                src={images[selectedIndex]?.path}
                alt={`${productName} - Image ${selectedIndex + 1}`}
              />
            </AspectRatio>
          </ImageZoom>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ScrollArea>
          <div className="flex gap-2 w-full pb-4">
            {images.map((img, idx) => (
              <button
                key={img._id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative aspect-square w-20 h-20 shrink-0 rounded-md border-2 overflow-hidden transition-all",
                  selectedIndex === idx
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/50",
                )}
              >
                <Image
                  width={120}
                  height={120}
                  src={img.path}
                  alt={`Thumbnail ${idx + 1}`}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
