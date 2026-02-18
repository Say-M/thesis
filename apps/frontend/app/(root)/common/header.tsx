"use client";

import { Fragment, useCallback, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useListPages } from "@/hooks/api/pages";
import {
  useListProducts,
  productListItemToCardProps,
  type ProductDetail,
} from "@/hooks/api/products";
import { formatCurrency } from "@/lib/format-currency-base";
import { Badge } from "@/components/ui/badge";
import {
  HeartIcon,
  Loader2Icon,
  SearchIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { DiscountType } from "@repo/common/enums/discount";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/auth";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import { Role } from "@repo/common/enums/role";
import Image from "next/image";
import { useConfigContext } from "@/contexts/config";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;
const SEARCH_RESULT_LIMIT = 8;

function SearchResultItem({
  product,
  onSelect,
}: {
  product: ProductDetail;
  onSelect: () => void;
}) {
  const { price, oldPrice } = productListItemToCardProps(product);
  const thumb = product.thumbnail?.path;
  const useVariant =
    product.hasVariants && product.variants?.length
      ? product.variants[0]
      : null;
  const discountValue = useVariant?.discountValue ?? product.discountValue ?? 0;
  const discountType = (useVariant?.discountType ?? product.discountType) as
    | string
    | undefined;
  const hasDiscount = oldPrice != null && oldPrice > price;
  const discountLabel = hasDiscount
    ? discountType === DiscountType.FIXED
      ? `${formatCurrency(oldPrice - price)} off`
      : discountValue > 0
        ? `${Math.round(discountValue)}% off`
        : null
    : null;

  return (
    <li role="option">
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors hover:bg-muted/80 focus:bg-muted/80"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <SearchIcon className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <div className="flex flex-wrap items-end gap-2 text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatCurrency(price)}
            </span>
            {oldPrice != null && oldPrice > price && (
              <span className="line-through text-xs mb-0.5">
                {formatCurrency(oldPrice)}
              </span>
            )}
          </div>
        </div>
        {discountLabel && (
          <Badge variant="destructive" className="text-xs">
            {discountLabel}
          </Badge>
        )}
      </button>
    </li>
  );
}

export default function Header() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { config } = useConfigContext();
  const { cart, wishlist } = useCartWishlist();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      const q = searchInput.trim();
      setDebouncedSearch(q);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: searchData, isLoading: searchLoading } = useListProducts({
    search: debouncedSearch,
    limit: SEARCH_RESULT_LIMIT,
    enabled: debouncedSearch.length >= SEARCH_MIN_LENGTH,
  });
  const searchProducts =
    searchData?.pages?.map((page) => page.products).flat() ?? [];

  const handleSelectProduct = useCallback(
    (slug: string) => {
      setSearchInput("");
      setDebouncedSearch("");
      setSearchOpen(false);
      router.push(`/products/${slug}`);
    },
    [router],
  );

  const { data: headerPagesData } = useListPages({
    status: "true",
    showInHeader: "true",
    all: "true",
  });
  const headerPages =
    headerPagesData?.pages?.map((page) => page.pages).flat() ?? [];

  return (
    <header className="sticky top-0 z-50 bg-background print:hidden">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-4 text-sm font-medium">
              {headerPages.length > 0 && (
                <>
                  {headerPages.map((page, index) => (
                    <Fragment key={page._id}>
                      <Link key={page._id} href={`/${page.slug}`}>
                        {page.title}
                      </Link>
                      {index < headerPages.length - 1 && (
                        <Separator orientation="vertical" className="h-3!" />
                      )}
                    </Fragment>
                  ))}
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm font-medium">
              {user ? (
                <>
                  {user?.role !== Role.USER && (
                    <>
                      <Link href="/dashboard">Dashboard</Link>
                      <Separator orientation="vertical" className="h-3!" />
                    </>
                  )}
                  <Link href="/profile">Profile</Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login">Login</Link>
                  <Separator orientation="vertical" className="h-3!" />
                  <Link href="/auth/register">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-6">
          <Link href="/">
            {config?.siteLogo ? (
              <Image
                src={config.siteLogo.path}
                alt={config.siteName}
                width={100}
                height={100}
                className="max-h-8 w-full object-cover"
              />
            ) : (
              <h1 className="text-2xl font-bold">{config?.siteName}</h1>
            )}
          </Link>
          <div className="max-w-xl w-full mx-auto">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverAnchor asChild>
                <div className="relative">
                  <InputGroup>
                    <InputGroupInput
                      autoComplete="off"
                      placeholder="Search products…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                        }
                      }}
                      aria-expanded={searchOpen}
                      aria-autocomplete="list"
                      aria-controls="header-search-results"
                      id="header-search-input"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        aria-label="Search"
                        onClick={() => {
                          if (searchInput.trim()) {
                            router.push(
                              `/products?search=${encodeURIComponent(searchInput.trim())}`,
                            );
                            setSearchOpen(false);
                          }
                        }}
                      >
                        <SearchIcon className="size-4" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </PopoverAnchor>
              <PopoverContent
                id="header-search-results"
                className="w-(--radix-popover-trigger-width) max-h-[min(70vh,400px)] overflow-y-auto p-0"
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {searchInput.trim().length < SEARCH_MIN_LENGTH ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Type at least {SEARCH_MIN_LENGTH} characters to search
                  </div>
                ) : searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-8">
                    <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Searching…
                    </span>
                  </div>
                ) : searchProducts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No products found
                  </div>
                ) : (
                  <ul className="py-2" role="listbox">
                    {searchProducts.map((product) => (
                      <SearchResultItem
                        key={product._id}
                        product={product}
                        onSelect={() => handleSelectProduct(product.slug)}
                      />
                    ))}
                  </ul>
                )}
                {debouncedSearch.length >= SEARCH_MIN_LENGTH &&
                  searchProducts.length > 0 && (
                    <div className="border-t p-2 text-center">
                      <Link
                        href={`/products?search=${encodeURIComponent(debouncedSearch)}`}
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => setSearchOpen(false)}
                      >
                        View all results for &quot;{debouncedSearch}&quot;
                      </Link>
                    </div>
                  )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon-sm" className="relative" asChild>
              <Link
                href="/cart"
                aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
              >
                <ShoppingCartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon-sm" className="relative" asChild>
              <Link
                href="/wishlist"
                aria-label={`Wishlist${wishlist?.length ? ` (${wishlist.length} items)` : ""}`}
              >
                <HeartIcon />
                {!!wishlist?.length && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {wishlist?.length > 99 ? "99+" : wishlist?.length}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
