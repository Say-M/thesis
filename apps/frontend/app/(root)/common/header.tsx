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
  LayoutDashboard,
  Loader2Icon,
  LogOut,
  SearchIcon,
  ShoppingCartIcon,
  User,
  User2Icon,
} from "lucide-react";
import { DiscountType } from "@repo/common/enums/discount";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/auth";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import { Role } from "@repo/common/enums/role";
import Image from "next/image";
import { useConfigContext } from "@/contexts/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useLogout } from "@/hooks/api/auth";

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
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

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
    <header className="top-0 z-50 bg-background print:hidden">
      <div className="hidden md:block border-b">
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
          </div>
        </div>
      </div>
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
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
          {/* Desktop Search - Full Width */}
          <div className="hidden md:block max-w-xl w-full mx-auto">
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

          <div className="flex items-center md:gap-4 gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative hidden md:inline-flex"
              asChild
            >
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
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative hidden md:inline-flex"
              asChild
            >
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
            <div className="md:hidden block">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverAnchor asChild>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                  >
                    <SearchIcon />
                  </Button>
                </PopoverAnchor>
                <PopoverContent
                  id="header-search-results-mobile"
                  className="w-svw md:hidden sm:w-md max-h-[min(70vh,400px)] overflow-y-auto p-0"
                  align="start"
                  sideOffset={8}
                  // onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="border-b bg-background p-4">
                    <InputGroup>
                      <InputGroupInput
                        autoComplete="off"
                        placeholder="Search products…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setSearchOpen(false);
                          }
                        }}
                        aria-expanded={searchOpen}
                        aria-autocomplete="list"
                        aria-controls="header-search-results-mobile"
                        id="header-search-input-mobile"
                        autoFocus
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="size-8 cursor-pointer">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium">{user?.name ?? "User"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email ?? user?.mobile ?? ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user?.role !== Role.USER && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" target="_blank">
                        <LayoutDashboard className="size-4" />
                        Go to Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="size-4" />
                    {isLoggingOut ? "Logging out…" : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative"
                asChild
              >
                <Link href="/auth/login">
                  <User2Icon className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
