"use client";

import { useState, useEffect, useMemo, useRef, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createInvoiceSchema,
  type CreateInvoiceSchemaType,
} from "@repo/common/schemas/invoice";
import {
  InvoiceType,
  PaymentMethod,
  PaymentType,
} from "@repo/common/enums/invoice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Truck,
  Tag,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency-base";
import { useCreateInvoice } from "@/hooks/api/invoices";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import {
  useListProducts,
  productListItemUnitPriceAndStock,
  type ProductDetail,
} from "@/hooks/api/products";
import { useValidateCoupon } from "@/hooks/api/coupons";
import { toast } from "sonner";
import { useConfigContext } from "@/contexts/config";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxApiSearch } from "@/components/ui/combobox-api-search";
import { UserSearchOption, useUserSearch } from "@/hooks/use-user-search";
import { Role } from "@repo/common/enums/role";
import { roundTo2 } from "@repo/common/utils/round-to-2";
import { FieldError } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";

const checkoutFormSchema = createInvoiceSchema
  .omit({ items: true, type: true })
  .extend({
    sameAsBilling: z.boolean().default(false),
  });

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type CartItem = {
  _id: string;
  productId: string;
  productSlug: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  thumbnailUrl: string;
  unitPrice: number;
  unitOldPrice: number | null;
  quantity: number;
  /** Business rule: order quantity minimum (falls back to 1). */
  minOrderQuantity: number;
  /**
   * Business rule: order quantity maximum.
   * When null/undefined or <= 0, there is effectively no max cap beyond stock.
   */
  maxOrderQuantity: number | null;
  stock: number;
  subtotal: number;
};

function buildCartItems(
  cart: { productId: string; quantity: number; variantId?: string }[],
  products: ProductDetail[],
): CartItem[] {
  const byId = new Map(products.map((p) => [p._id, p]));
  const items: CartItem[] = [];
  for (const line of cart) {
    const product = byId.get(line.productId);
    if (!product) continue;

    const { unitPrice, unitOldPrice, stock } = productListItemUnitPriceAndStock(
      product,
      line.variantId,
    );

    // Derive business min/max order quantities from variant or product.
    let minOrderQuantity = 1;
    let maxOrderQuantity: number | null = null;

    if (product.hasVariants && line.variantId && product.variants?.length) {
      const variant = product.variants.find((v) => v._id === line.variantId);
      if (variant) {
        const vMin =
          typeof variant.minQuantity === "number" ? variant.minQuantity : null;
        const vMax =
          typeof variant.maxQuantity === "number" ? variant.maxQuantity : null;

        if (vMin != null && vMin > 0) {
          minOrderQuantity = vMin;
        }
        if (vMax != null && vMax > 0) {
          maxOrderQuantity = vMax;
        }
      }
    } else {
      const pMin =
        typeof product.minQuantity === "number" ? product.minQuantity : null;
      const pMax =
        typeof product.maxQuantity === "number" ? product.maxQuantity : null;

      if (pMin != null && pMin > 0) {
        minOrderQuantity = pMin;
      }
      if (pMax != null && pMax > 0) {
        maxOrderQuantity = pMax;
      }
    }

    const effectiveStock = stock ?? 0;
    const maxAllowed =
      maxOrderQuantity != null && maxOrderQuantity > 0
        ? Math.min(maxOrderQuantity, effectiveStock || 999)
        : effectiveStock || 999;
    const minAllowed = Math.min(Math.max(1, minOrderQuantity), maxAllowed || 1);

    const safeQuantity = Math.min(
      Math.max(minAllowed, line.quantity),
      maxAllowed,
    );

    const variantLabel = line.variantId
      ? product.variants?.find((v) => v._id === line.variantId)?.name
      : undefined;
    items.push({
      _id: line.variantId
        ? `${line.productId}:${line.variantId}`
        : line.productId,
      productId: line.productId,
      productSlug: product.slug,
      name: product.name,
      variantId: line.variantId,
      variantLabel,
      thumbnailUrl: product.thumbnail?.path ?? "",
      unitPrice,
      unitOldPrice,
      quantity: safeQuantity,
      minOrderQuantity: minAllowed,
      maxOrderQuantity:
        maxOrderQuantity != null && maxOrderQuantity > 0 ? maxAllowed : null,
      stock: effectiveStock,
      subtotal: roundTo2(unitPrice * safeQuantity),
    });
  }
  return items;
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { config } = useConfigContext();
  const searchUsers = useUserSearch();

  // Get available shipping charges
  const shippingCharges = config?.shippingCharges ?? [];
  const defaultShippingCharge = shippingCharges[0];
  const [selectedShippingCharge, setSelectedShippingCharge] = useState<
    typeof defaultShippingCharge | null
  >(defaultShippingCharge ?? null);
  const shippingAmount = selectedShippingCharge?.price ?? 0;
  const taxAmount = config?.taxAmount ?? 0;
  // const codAmount = config?.codAmount ?? 0;
  const { cart, removeFromCart, updateCartQuantity, clearCart } =
    useCartWishlist();
  const productIds = useMemo(
    () => [...new Set(cart.map((x) => x.productId))].join(","),
    [cart],
  );
  const {
    data: productsData,
    status: productsStatus,
    isFetchingNextPage: isFetchingNextProductsPage,
  } = useListProducts({
    productIds,
    enabled: productIds.length > 0,
  });
  const products = useMemo(
    () => productsData?.pages?.map((page) => page.products).flat() ?? [],
    [productsData],
  );
  const cartItems = useMemo(
    () => buildCartItems(cart, products),
    [cart, products],
  );
  const [couponCode, setCouponCode] = useState("");
  /** When a coupon is applied: server coupon details used for live discount calculation. */
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    isFreeShipping?: boolean;
    description?: string;
  } | null>(null);
  /** When a coupon is applied: code for display. */
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
    null,
  );

  const { mutateAsync: validateCoupon, isPending: isCouponValidating } =
    useValidateCoupon();

  const { mutate: createInvoice, isPending: isCheckoutPending } =
    useCreateInvoice();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema) as never,
    defaultValues: {
      customer: { name: "", email: "", phone: "" },
      shippingAddress: {
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
      },
      notes: "",
      sameAsBilling: false,
      shippingChargeName: defaultShippingCharge?.name ?? null,
      // transaction: {
      //   paymentMethod: PaymentMethod.CASH,
      //   reference: "",
      // },
    },
  });

  const sameAsBilling = form.watch("sameAsBilling");
  const hasPrefilledUser = useRef(false);

  // Update shippingChargeName when selectedShippingCharge changes
  useEffect(() => {
    if (selectedShippingCharge) {
      form.setValue("shippingChargeName", selectedShippingCharge.name ?? null);
    }
  }, [selectedShippingCharge, form]);

  // Pre-fill customer and addresses from logged-in user's profile (once)
  useEffect(() => {
    if (!user || hasPrefilledUser.current) return;
    hasPrefilledUser.current = true;
    const customer = {
      user: user._id,
      name: user.name ?? "",
      email: user.email ?? user.mobile ?? "",
      phone: user.mobile ?? "",
    };
    const shippingFromProfile = user.shippingAddress;
    const shippingAddress = {
      name: shippingFromProfile?.name ?? customer.name,
      email: shippingFromProfile?.email ?? customer.email ?? "",
      phone: shippingFromProfile?.phone ?? customer.phone,
      address: shippingFromProfile?.address ?? "",
      city: shippingFromProfile?.city ?? "",
    };
    const current = form.getValues();
    form.reset({
      ...current,
      customer,
      shippingAddress: shippingAddress,
    });
  }, [user, form]);

  // Match backend: subtotal and totalBeforeCod for COD; round codFee and total to 2 decimals
  const subtotal = roundTo2(
    cartItems.reduce((sum, item) => sum + item.subtotal, 0),
  );
  // Derived discounts from applied coupon so they stay in sync with cart totals.
  const { couponDiscountAmount, appliedFreeShipping } = useMemo(() => {
    if (!appliedCoupon || subtotal < (appliedCoupon?.minPurchase || 0)) {
      return {
        couponDiscountAmount: 0,
        appliedFreeShipping: false,
      };
    }

    const isPercentage =
      appliedCoupon.discountType === "Percentage" ||
      appliedCoupon.discountType?.toLowerCase() === "percentage";

    let couponDiscount = isPercentage
      ? roundTo2((subtotal * appliedCoupon.value) / 100)
      : roundTo2(appliedCoupon.value);

    if (
      isPercentage &&
      appliedCoupon.maxDiscount != null &&
      couponDiscount > appliedCoupon.maxDiscount
    ) {
      couponDiscount = appliedCoupon.maxDiscount;
    }

    return {
      couponDiscountAmount: couponDiscount,
      appliedFreeShipping: Boolean(appliedCoupon.isFreeShipping),
    };
  }, [appliedCoupon, subtotal, shippingAmount]);

  const totalBeforeCod =
    subtotal +
    (appliedFreeShipping ? 0 : shippingAmount) +
    taxAmount -
    couponDiscountAmount;

  // const codFee =
  //   codAmount > 0 ? roundTo2((totalBeforeCod * codAmount) / 100) : 0;
  const total = roundTo2(totalBeforeCod);
  //  + codFee);

  const updateQuantity = (item: CartItem, delta: number) => {
    const maxAllowed =
      item.maxOrderQuantity != null && item.maxOrderQuantity > 0
        ? Math.min(item.maxOrderQuantity, item.stock)
        : item.stock;
    const minAllowed = Math.min(
      Math.max(1, item.minOrderQuantity),
      maxAllowed || 1,
    );
    const newQuantity = Math.max(
      minAllowed,
      Math.min(maxAllowed, item.quantity + delta),
    );
    updateCartQuantity(item.productId, newQuantity, item.variantId);
  };

  const removeItem = (item: CartItem) => {
    removeFromCart(item.productId, item.variantId);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }
    try {
      const res = await validateCoupon({ code, cartTotal: subtotal });
      if (res?.data?.isValid && res?.data?.coupon) {
        const coupon = res.data.coupon;

        // Frontend guard: enforce minPurchase against current cart subtotal.
        if (coupon.minPurchase != null && subtotal < coupon.minPurchase) {
          setAppliedCoupon(null);
          setAppliedCouponCode(null);
          toast.error(
            `Coupon requires a minimum purchase of ${formatCurrency(
              coupon.minPurchase,
            )}.`,
          );
          return;
        }

        setAppliedCoupon(coupon);
        setAppliedCouponCode(coupon.code ?? code.toUpperCase());
        toast.success("Coupon applied");
      } else {
        setAppliedCoupon(null);
        setAppliedCouponCode(null);
        toast.error(res?.message ?? "Invalid coupon");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid coupon";
      setAppliedCoupon(null);
      setAppliedCouponCode(null);
      toast.error(message);
    }
  };

  const toOptionalEmail = (v: string | null | undefined) =>
    v?.trim() || undefined;

  const onSubmit = (values: CheckoutFormValues) => {
    if (cartItems.length === 0) return;
    const payload: CreateInvoiceSchemaType = {
      ...values,
      type: InvoiceType.ONLINE,
      items: cartItems.map((item) => ({
        product: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
      coupon: couponCode.trim() || undefined,
      notes: toOptionalEmail(values.notes),
    };
    createInvoice(payload, {
      onSuccess: ({ data }) => {
        const redirectUrl = data?.redirectUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
        const invoiceNumber = data?.invoice?.invoiceNumber;
        clearCart();
        setCouponCode("");
        setAppliedCoupon(null);
        setAppliedCouponCode(null);
        form.reset();
        if (invoiceNumber) {
          router.push(`/invoices/${invoiceNumber}`);
        } else {
          router.push("/products");
        }
      },
    });
  };

  if (cart.length === 0 && !isCheckoutPending) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4">
          <ShoppingCart className="size-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <p className="text-muted-foreground">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (
    cart.length > 0 &&
    (isFetchingNextProductsPage || productsStatus === "pending")
  ) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/products">
              <ArrowLeft />
            </Link>
          </Button>
          <p className="text-muted-foreground">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your
            cart
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems?.map((item) => (
              <Card key={item._id}>
                <CardContent>
                  <div className="flex xs:flex-row flex-col gap-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item)}
                      aria-label="Remove item"
                      className="shrink-0 absolute -top-2 -right-3"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Link href={`/products/${item.productSlug}`}>
                      <div className="relative w-24 h-24 rounded-md border bg-muted overflow-hidden shrink-0">
                        <Image
                          width={96}
                          height={96}
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-medium hover:text-primary transition-colors line-clamp-2 mr-8"
                          >
                            {item.name}
                            {item.variantLabel && (
                              <span className="text-sm text-muted-foreground ml-1 font-normal">
                                ({item.variantLabel})
                              </span>
                            )}
                          </Link>
                          <div className="flex flex-wrap gap-1 items-center mt-1">
                            <span className="font-semibold text-primary">
                              {formatCurrency(item.unitPrice)}
                            </span>
                            {item.unitOldPrice && (
                              <span className="text-xs text-muted-foreground line-through mt-0.5 mr-4">
                                {formatCurrency(item.unitOldPrice)}
                              </span>
                            )}
                            {item.stock < 10 && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-500 text-white text-xs"
                              >
                                Low stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(item, -1)}
                            disabled={item.quantity <= item.minOrderQuantity}
                          >
                            <Minus />
                          </Button>
                          <Input
                            type="number"
                            min={item.minOrderQuantity}
                            max={
                              item.maxOrderQuantity != null &&
                              item.maxOrderQuantity > 0
                                ? Math.min(item.maxOrderQuantity, item.stock)
                                : item.stock
                            }
                            value={item.quantity}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value);
                              const maxAllowed =
                                item.maxOrderQuantity != null &&
                                item.maxOrderQuantity > 0
                                  ? Math.min(item.maxOrderQuantity, item.stock)
                                  : item.stock;
                              const minAllowed = Math.min(
                                Math.max(1, item.minOrderQuantity),
                                maxAllowed || 1,
                              );
                              const val = Number.isFinite(raw)
                                ? raw
                                : minAllowed;
                              const clamped = Math.min(
                                Math.max(minAllowed, val),
                                maxAllowed,
                              );
                              updateQuantity(item, clamped - item.quantity);
                            }}
                            className="w-12 text-center h-6 rounded text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(item, 1)}
                            disabled={
                              item.maxOrderQuantity != null &&
                              item.maxOrderQuantity > 0
                                ? item.quantity >=
                                  Math.min(item.maxOrderQuantity, item.stock)
                                : item.quantity >= item.stock
                            }
                          >
                            <Plus />
                          </Button>
                        </div>
                        <div className="text-right -mt-2">
                          <p className="text-sm text-muted-foreground">
                            Subtotal
                          </p>
                          <p className="font-medium sm:font-semibold text-sm sm:text-base">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Checkout form: Customer & Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Checkout details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Customer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user && user?.role !== Role.USER && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="customer.user">
                          Select User (optional)
                        </Label>
                        <ComboboxApiSearch<UserSearchOption>
                          searchFn={searchUsers}
                          getOptionLabel={(o) => o.label}
                          getOptionValue={(o) => o._id}
                          value={form.watch("customer.user") || null}
                          onChange={(opt) => {
                            if (opt) {
                              const user = opt as UserSearchOption;
                              form.setValue("customer.user", user._id);
                              form.setValue("customer.name", user.name);
                              form.setValue(
                                "customer.email",
                                user.email || undefined,
                              );
                              form.setValue(
                                "customer.phone",
                                user.mobile || "",
                              );
                            } else {
                              form.setValue("customer.user", undefined);
                            }
                          }}
                          placeholder="Search users…"
                          debounceMs={300}
                          minQueryLength={1}
                          clearable
                        />
                        {form.formState.errors.customer?.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.customer.name.message}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="customer.name">Name *</Label>
                      <Input
                        id="customer.name"
                        {...form.register("customer.name")}
                        placeholder="Full name"
                      />
                      {form.formState.errors.customer?.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.customer.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer.email">Email</Label>
                      <Input
                        id="customer.email"
                        type="email"
                        {...form.register("customer.email")}
                        placeholder="email@example.com"
                      />
                      {form.formState.errors.customer?.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.customer.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer.phone">Phone *</Label>
                      <Input
                        id="customer.phone"
                        {...form.register("customer.phone")}
                        placeholder="Phone number"
                      />
                      {form.formState.errors.customer?.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.customer.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {!sameAsBilling && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Shipping address</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="shippingAddress.name">Name *</Label>
                        <Input
                          id="shippingAddress.name"
                          {...form.register("shippingAddress.name")}
                          placeholder="Full name"
                        />
                        {form.formState.errors.shippingAddress?.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.shippingAddress.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingAddress.email">Email</Label>
                        <Input
                          id="shippingAddress.email"
                          type="email"
                          {...form.register("shippingAddress.email")}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingAddress.phone">Phone *</Label>
                        <Input
                          id="shippingAddress.phone"
                          {...form.register("shippingAddress.phone")}
                          placeholder="Phone"
                        />
                        {form.formState.errors.shippingAddress?.phone && (
                          <p className="text-sm text-destructive">
                            {
                              form.formState.errors.shippingAddress.phone
                                .message
                            }
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="shippingAddress.address">
                          Address *
                        </Label>
                        <Input
                          id="shippingAddress.address"
                          {...form.register("shippingAddress.address")}
                          placeholder="Street address"
                        />
                        {form.formState.errors.shippingAddress?.address && (
                          <p className="text-sm text-destructive">
                            {
                              form.formState.errors.shippingAddress.address
                                .message
                            }
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingAddress.city">City *</Label>
                        <Input
                          id="shippingAddress.city"
                          {...form.register("shippingAddress.city")}
                          placeholder="City"
                        />
                        {form.formState.errors.shippingAddress?.city && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.shippingAddress.city.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Order notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Optional notes for your order"
                  />
                </div>

                <Separator />

                {/* Shipping Method Selection */}
                {shippingCharges.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Truck className="size-4" />
                      Shipping method
                    </h4>
                    <RadioGroup
                      value={selectedShippingCharge?.name ?? ""}
                      onValueChange={(value) => {
                        const charge = shippingCharges.find(
                          (c) => c.name === value,
                        );
                        if (charge) {
                          setSelectedShippingCharge(charge);
                        }
                      }}
                    >
                      <div className="space-y-3">
                        {shippingCharges.map((charge, index) => (
                          <Label
                            key={index}
                            htmlFor={`shipping-${index}`}
                            className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <RadioGroupItem
                              value={charge.name}
                              id={`shipping-${index}`}
                              className="mt-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {charge.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(charge.price)}
                              </p>
                            </div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <Separator />

                {/* <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="size-4" />
                    Payment information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction.paymentMethod">
                        Payment method *
                      </Label>
                      <Select
                        value={form.watch("transaction.paymentMethod")}
                        onValueChange={(v) =>
                          form.setValue(
                            "transaction.paymentMethod",
                            v as PaymentMethod,
                          )
                        }
                      >
                        <SelectTrigger
                          id="transaction.paymentMethod"
                          className="w-full"
                        >
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PaymentMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError
                        errors={
                          form.formState.errors.transaction?.paymentMethod
                            ? [form.formState.errors.transaction.paymentMethod]
                            : undefined
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transaction.reference">
                        Reference (optional)
                      </Label>
                      <Input
                        id="transaction.reference"
                        {...form.register("transaction.reference")}
                        placeholder="e.g. transaction ID"
                      />
                      <FieldError
                        errors={
                          form.formState.errors.transaction?.reference
                            ? [form.formState.errors.transaction.reference]
                            : undefined
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Amount to pay: {formatCurrency(total)} (see Order Summary)
                  </p>
                </div> */}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Coupon code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => applyCoupon()}
                      variant="outline"
                      disabled={isCouponValidating}
                      size="icon"
                    >
                      {isCouponValidating ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Tag className="size-4" />
                      )}
                    </Button>
                  </div>
                  {subtotal >= (appliedCoupon?.minPurchase || 0) &&
                    appliedCouponCode && (
                      <p className="text-xs text-green-600">
                        Coupon <strong>{appliedCouponCode}</strong> applied
                        {couponDiscountAmount > 0
                          ? ` · ${formatCurrency(couponDiscountAmount)} off`
                          : ""}
                      </p>
                    )}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      {taxAmount > 0 ? (
                        formatCurrency(taxAmount)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div> */}
                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {appliedCouponCode ? ` (${appliedCouponCode})` : ""}
                      </span>
                      <span>-{formatCurrency(couponDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="size-3" />
                      Shipping
                    </span>
                    <span>
                      {appliedFreeShipping && shippingAmount > 0 ? (
                        <span className="text-green-600">Free (coupon)</span>
                      ) : shippingAmount > 0 ? (
                        formatCurrency(shippingAmount)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cash on delivery
                      {codAmount > 0 ? ` (${codAmount}%)` : ""}
                    </span>
                    <span>
                      {codAmount > 0 ? (
                        formatCurrency(codFee)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div> */}
                </div>

                <Separator />

                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={isCheckoutPending || cartItems.length === 0}
                  onClick={() => {
                    form.setValue("paymentType", PaymentType.ONLINE);
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {isCheckoutPending && <Spinner className="size-4" />}
                  Pay Online
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  disabled={isCheckoutPending || cartItems.length === 0}
                  onClick={() => {
                    form.setValue("paymentType", PaymentType.COD);
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {isCheckoutPending && <Spinner className="size-4" />}
                  Cash on delivary
                </Button>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
