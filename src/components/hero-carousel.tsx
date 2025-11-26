"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  accent: string;
};

type Props = {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const handler = () => setCurrent(api.selectedScrollSnap());
    handler();
    api.on("select", handler);
    return () => {
      api.off("select", handler);
    };
  }, [api]);

  return (
    <section className="mb-16">
      <Carousel opts={{ loop: true }} setApi={setApi}>
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.title}>
              <div
                className={cn(
                  "rounded-3xl border bg-gradient-to-br px-10 py-12 text-center md:text-left",
                  slide.accent
                )}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {slide.eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground md:max-w-2xl">
                  {slide.description}
                </p>
                <div className="mt-6 flex flex-col gap-3 md:flex-row">
                  <Button asChild size="lg">
                    <Link href={slide.href}>{slide.cta}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/agent">Chat with Shopping Assistant</Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-6 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-all",
              current === index
                ? "bg-primary"
                : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
