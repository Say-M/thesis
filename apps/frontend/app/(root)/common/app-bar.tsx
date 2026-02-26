"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  TruckIcon,
  ShoppingCartIcon,
  MenuIcon,
  HeartIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useListPages } from "@/hooks/api/pages";
import { useListCategories } from "@/hooks/api/categories";
import { groupCategoriesByParent } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PageWithTag {
  _id: string;
  title: string;
  slug: string;
  tag?: string | null;
}

function groupPagesByTag<T extends PageWithTag>(
  pages: T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const page of pages) {
    const tag = (page.tag ?? "Other").trim() || "Other";
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(page);
  }
  return grouped;
}

export default function AppBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { cart, wishlist } = useCartWishlist();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const { data: allPagesData } = useListPages({
    all: "true",
    showInMenu: "true",
  });
  const allPages = allPagesData?.pages?.map((page) => page.pages).flat() ?? [];
  const groupedPages = groupPagesByTag(allPages);
  const tagKeys = Object.keys(groupedPages).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const { data: allCategoriesData } = useListCategories({
    type: "child",
    status: "true",
    all: "true",
  });

  const allCategories =
    allCategoriesData?.pages?.map((page) => page.categories).flat() ?? [];

  const groupedCategories = groupCategoriesByParent(allCategories);

  return (
    <nav className="block md:hidden border-t z-50 bottom-0 bg-background px-4 py-2 print:hidden">
      <div className="flex items-center justify-between gap-4 relative">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="rounded-full">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="max-w-xs"
          >
            <ScrollArea className="space-y-2 py-4 overflow-hidden">
              <Link
                href="/products?isFreeShipping=true"
                onClick={() => setSheetOpen(false)}
                className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted transition-colors"
              >
                <span className="font-medium">Free Shipping</span>
              </Link>
              <div className="mt-auto"></div>
              {Object.keys(groupedCategories).map((category) => (
                <Collapsible
                  key={category}
                  defaultOpen={Object.keys(groupedCategories).length === 1}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted transition-colors">
                    <span className="font-medium">
                      {groupedCategories[category].parentCategory.name}
                    </span>
                    <ChevronDownIcon className="size-4 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {groupedCategories[category].subcategories.map(
                      (subcategory) => (
                        <Link
                          key={subcategory._id}
                          href={`/products?category=${category}&subcategory=${subcategory._id}`}
                          onClick={() => setSheetOpen(false)}
                          className="block px-8 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {subcategory.name}
                        </Link>
                      ),
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {tagKeys?.map((tag) => (
                <Collapsible key={tag} defaultOpen={tagKeys.length === 1}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted transition-colors">
                    <span className="font-medium">{tag}</span>
                    <ChevronDownIcon className="size-4 transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {groupedPages[tag].map((page) => (
                      <Link
                        key={page._id}
                        href={`/${page.slug}`}
                        onClick={() => setSheetOpen(false)}
                        className="block px-8 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        {page.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </ScrollArea>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Button variant="ghost" size="icon-lg" className="rounded-full" asChild>
          <Link href="/track-order">
            <TruckIcon />
          </Link>
        </Button>
        <Button
          variant="default"
          size="icon-lg"
          className="rounded-full size-12 -mt-12"
          asChild
        >
          <Link href="/">
            <HomeIcon />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-lg" className="rounded-full" asChild>
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlist?.length ? ` (${wishlist.length} items)` : ""}`}
          >
            <HeartIcon />
            {!!wishlist?.length && (
              <span className="absolute top-1 right-1 flex size-3 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {wishlist?.length > 99 ? "99+" : wishlist?.length}
              </span>
            )}
          </Link>
        </Button>
        <Button variant="ghost" size="icon-lg" className="rounded-full" asChild>
          <Link
            href="/cart"
            aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
          >
            <ShoppingCartIcon />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 flex size-3 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </nav>
  );
}
