"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Tag, Truck } from "lucide-react";
import {
  createInvoiceSchema,
  CreateInvoiceSchemaType,
  updateInvoiceSchema,
  UpdateInvoiceSchemaType,
} from "@repo/common/schemas/invoice";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useFieldArray, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboboxApiSearch } from "@/components/ui/combobox-api-search";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductSearch } from "@/hooks/use-product-search";
import { useUserSearch } from "@/hooks/use-user-search";
import {
  useGetOrder,
  useCreateOrder,
  useUpdateOrder,
} from "@/hooks/api/orders";
import { useGetProduct } from "@/hooks/api/products";
import { useValidateCoupon } from "@/hooks/api/coupons";
import { useConfigContext } from "@/contexts/config";
import { InvoiceType, PaymentMethod } from "@repo/common/enums/invoice";
import { useFormatCurrency } from "@/lib/format-currency";
import { toast } from "sonner";
import type { ProductSearchOption } from "@/hooks/use-product-search";
import type { UserSearchOption } from "@/hooks/use-user-search";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

type OrderFormValues = CreateInvoiceSchemaType;

const defaultItem = {
  product: "",
  variantId: undefined as string | undefined,
  quantity: 1,
};

const defaultValues: OrderFormValues = {
  type: InvoiceType.ONLINE,
  customer: {
    name: "",
    email: "",
    phone: "",
    user: undefined,
  },
  items: [defaultItem],
  coupon: undefined,
  notes: undefined,
  billingAddress: {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  },
  shippingAddress: {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  },
  transaction: {
    paymentMethod: PaymentMethod.CASH,
    reference: "",
  },
};

function ProductVariantField({
  index,
  form,
  compact,
}: {
  index: number;
  form: ReturnType<typeof useForm<OrderFormValues>>;
  compact?: boolean;
}) {
  const productId = form.watch(`items.${index}.product`);
  const { data: productData } = useGetProduct(productId || null);
  const product = productData?.data?.product;

  const hasVariants = product?.hasVariants && !!product?.variants?.length;
  const variants = product?.variants || [];

  if (!hasVariants) return null;

  return (
    <Controller
      name={`items.${index}.variantId`}
      control={form.control}
      render={({ field, fieldState }) => {
        if (!productId) {
          return <div />;
        }

        const select = (
          <Select
            value={field.value || ""}
            onValueChange={(value) => field.onChange(value || undefined)}
          >
            <SelectTrigger className={compact ? "h-8 w-full" : undefined}>
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => {
                return (
                  <SelectItem key={variant?._id} value={variant?._id}>
                    {variant?.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

        if (compact) {
          return (
            <>
              {select}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </>
          );
        }

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Variant</FieldLabel>
            {select}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

function LineItemPriceCell({
  index,
  form,
}: {
  index: number;
  form: ReturnType<typeof useForm<OrderFormValues>>;
}) {
  const formatCurrency = useFormatCurrency();
  const productId = form.watch(`items.${index}.product`);
  const variantId = form.watch(`items.${index}.variantId`);
  const quantity = form.watch(`items.${index}.quantity`) ?? 1;
  const { data: productData } = useGetProduct(productId || null);
  const product = productData?.data?.product;

  if (!product) {
    return (
      <>
        <TableCell className="text-muted-foreground text-right">—</TableCell>
        <TableCell className="text-muted-foreground text-right">—</TableCell>
        <TableCell className="text-muted-foreground text-right">—</TableCell>
      </>
    );
  }

  const hasVariants = product.hasVariants && product.variants?.length;
  const variant =
    hasVariants && variantId ? product.variants?.find((v) => v._id) : null;

  const unitPrice = variant
    ? (variant?.sellingPrice ?? 0)
    : (product?.sellingPrice ?? 0);
  const discountType = (variant ?? product) as {
    discountType?: string;
    discountValue?: number;
  };
  const dType = discountType.discountType ?? "Percentage";
  const dVal = discountType.discountValue ?? 0;
  const isPercent = dType === "Percentage" || dType === "percentage";
  const discountAmount =
    dVal <= 0 ? 0 : isPercent ? (unitPrice * dVal) / 100 : dVal;
  const afterDiscount = unitPrice - discountAmount;
  const lineTotal = afterDiscount * quantity;
  const lineDiscountTotal = discountAmount * quantity;

  const discountLabel =
    lineDiscountTotal <= 0 ? "—" : formatCurrency(lineDiscountTotal);

  return (
    <>
      <TableCell className="tabular-nums text-right">
        {formatCurrency(unitPrice)}
      </TableCell>
      <TableCell className="tabular-nums text-right">{discountLabel}</TableCell>
      <TableCell className="tabular-nums font-medium text-right">
        {formatCurrency(lineTotal)}
      </TableCell>
    </>
  );
}

/** Compute line total and line discount from form item + cached product option (from searchFn). */
function getLineTotalsFromOption(
  item: { product: string; variantId?: string | null; quantity: number },
  option: ProductSearchOption | undefined,
): { lineTotal: number; lineDiscount: number } {
  if (!option) return { lineTotal: 0, lineDiscount: 0 };
  const qty = item.quantity ?? 1;
  const hasVariants = option.hasVariants && option.variants?.length;
  const variant =
    hasVariants && item.variantId
      ? option.variants?.find((v) => v._id === item.variantId)
      : null;
  const unitPrice = variant ? variant.sellingPrice : (option.sellingPrice ?? 0);
  const dType = (variant ?? option).discountType ?? "Percentage";
  const dVal = (variant ?? option).discountValue ?? 0;
  const isPercent = dType === "Percentage" || dType === "percentage";
  const discountAmount =
    dVal <= 0 ? 0 : isPercent ? (unitPrice * dVal) / 100 : dVal;
  const afterDiscount = unitPrice - discountAmount;
  const lineTotal = afterDiscount * qty;
  const lineDiscount = discountAmount * qty;
  return { lineTotal, lineDiscount };
}

function OrderItemsFooterTotals({
  form,
  itemFields,
  productOptionsCache,
}: {
  form: ReturnType<typeof useForm<OrderFormValues>>;
  itemFields: { id: string }[];
  productOptionsCache: Record<string, ProductSearchOption>;
}) {
  const formatCurrency = useFormatCurrency();
  const items = form.watch("items") ?? [];
  const { totalDiscount, grandTotal } = itemFields.reduce(
    (acc, _, index) => {
      const item = items[index];
      if (!item) return acc;
      const option = item.product
        ? productOptionsCache[item.product]
        : undefined;
      const { lineTotal, lineDiscount } = getLineTotalsFromOption(
        {
          product: item.product,
          variantId: item.variantId,
          quantity: item.quantity ?? 1,
        },
        option,
      );
      return {
        totalDiscount: acc.totalDiscount + lineDiscount,
        grandTotal: acc.grandTotal + lineTotal,
      };
    },
    { totalDiscount: 0, grandTotal: 0 },
  );

  return (
    <TableRow className="bg-muted/50 font-medium">
      <TableCell colSpan={4} className="text-right">
        Subtotal
      </TableCell>
      <TableCell className="tabular-nums text-right">
        {totalDiscount > 0 ? formatCurrency(totalDiscount) : "—"}
      </TableCell>
      <TableCell className="tabular-nums text-right">
        {formatCurrency(grandTotal)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

function orderToFormValues(order: any): Partial<OrderFormValues> {
  return {
    type: order.type ?? InvoiceType.ONLINE,
    customer: {
      name: order.customer?.name ?? "",
      email: order.customer?.email ?? "",
      phone: order.customer?.phone ?? "",
      user: order.customer?.user
        ? typeof order.customer.user === "object"
          ? order.customer.user._id
          : order.customer.user
        : undefined,
    },
    items: order.items?.map((item: any) => ({
      product:
        typeof item.product === "object" ? item.product._id : item.product,
      variantId: item.variantId
        ? typeof item.variantId === "object"
          ? item.variantId._id
          : item.variantId
        : undefined,
      quantity: item.quantity ?? 1,
    })) ?? [defaultItem],
    coupon: order.coupon
      ? typeof order.coupon === "object"
        ? order.coupon._id
        : order.coupon
      : undefined,
    notes: order.notes ?? undefined,
    billingAddress: order.billingAddress
      ? {
          name: order.billingAddress.name ?? "",
          email: order.billingAddress.email ?? "",
          phone: order.billingAddress.phone ?? "",
          address: order.billingAddress.address ?? "",
          city: order.billingAddress.city ?? "",
          state: order.billingAddress.state ?? "",
          postalCode: order.billingAddress.postalCode ?? "",
        }
      : defaultValues.billingAddress,
    shippingAddress: order.shippingAddress
      ? {
          name: order.shippingAddress.name ?? "",
          email: order.shippingAddress.email ?? "",
          phone: order.shippingAddress.phone ?? "",
          address: order.shippingAddress.address ?? "",
          city: order.shippingAddress.city ?? "",
          state: order.shippingAddress.state ?? "",
          postalCode: order.shippingAddress.postalCode ?? "",
        }
      : defaultValues.shippingAddress,
  };
}

export default function AddEditOrder() {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const isCreate = orderId === "create";
  const searchProducts = useProductSearch();
  const searchUsers = useUserSearch();
  const { config } = useConfigContext();
  const { mutateAsync: validateCoupon, isPending: isCouponValidating } =
    useValidateCoupon();

  const shippingAmount = config?.shippingAmount ?? 0;
  const taxAmount = config?.taxAmount ?? 0;
  const codAmount = config?.codAmount ?? 0;

  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedFreeShipping, setAppliedFreeShipping] = useState(false);

  const { data: orderData, isLoading: loadingOrder } = useGetOrder(
    isCreate ? null : orderId,
  );
  const order = orderData?.data?.invoice;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(
      isCreate ? createInvoiceSchema : updateInvoiceSchema,
    ) as Resolver<OrderFormValues>,
    defaultValues,
  });

  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const isPending = isCreating || isUpdating || loadingOrder;

  useEffect(() => {
    if (!isCreate && order) {
      form.reset({
        ...defaultValues,
        ...orderToFormValues(order),
      });
      setDiscountAmount(0);
      setAppliedFreeShipping(false);
    } else if (isCreate) {
      form.reset(defaultValues);
      setDiscountAmount(0);
      setAppliedFreeShipping(false);
    }
  }, [isCreate, order, form]);

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  /** Cache of product options from searchFn when user selects a product (no extra API for totals). */
  const [productOptionsCache, setProductOptionsCache] = useState<
    Record<string, ProductSearchOption>
  >({});

  const items = form.watch("items") ?? [];
  const subtotal = useMemo(
    () =>
      roundTo2(
        itemFields.reduce((sum, _, index) => {
          const item = items[index];
          if (!item) return sum;
          const option = item.product
            ? productOptionsCache[item.product]
            : undefined;
          const { lineTotal } = getLineTotalsFromOption(
            {
              product: item.product,
              variantId: item.variantId,
              quantity: item.quantity ?? 1,
            },
            option,
          );
          return sum + lineTotal;
        }, 0),
      ),
    [items, itemFields, productOptionsCache],
  );

  const totalBeforeCod = roundTo2(
    subtotal +
      (appliedFreeShipping ? 0 : shippingAmount) +
      taxAmount -
      discountAmount,
  );
  const codFee =
    codAmount > 0 ? roundTo2((totalBeforeCod * codAmount) / 100) : 0;
  const orderTotal = roundTo2(totalBeforeCod + codFee);

  const applyCoupon = async () => {
    const code = form.getValues("coupon")?.trim();
    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }
    try {
      const res = await validateCoupon({ code, cartTotal: subtotal });
      if (res?.data?.isValid && res?.data?.coupon) {
        const coupon = res.data.coupon;
        const isPercentage =
          coupon.discountType === "Percentage" ||
          coupon.discountType?.toLowerCase() === "percentage";
        let couponDiscount = isPercentage
          ? roundTo2((subtotal * coupon.value) / 100)
          : roundTo2(coupon.value);
        if (
          isPercentage &&
          coupon.maxDiscount != null &&
          couponDiscount > coupon.maxDiscount
        ) {
          couponDiscount = coupon.maxDiscount;
        }
        const discount = roundTo2(
          couponDiscount + (coupon.isFreeShipping ? shippingAmount : 0),
        );
        setDiscountAmount(discount);
        setAppliedFreeShipping(Boolean(coupon.isFreeShipping));
        toast.success("Coupon applied");
      } else {
        setDiscountAmount(0);
        setAppliedFreeShipping(false);
        toast.error(res?.message ?? "Invalid coupon");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid coupon";
      setDiscountAmount(0);
      setAppliedFreeShipping(false);
      toast.error(message);
    }
  };

  // Sync transaction amount with order total when creating
  useEffect(() => {
    if (isCreate && orderTotal > 0) {
      const prev = form.getValues("transaction");
      form.setValue("transaction", {
        ...prev,
        amount: orderTotal,
      } as OrderFormValues["transaction"]);
    }
  }, [isCreate, orderTotal, form]);

  const onSubmit = (values: OrderFormValues) => {
    if (isCreate) {
      createOrder(values, {
        onSuccess: (data) => {
          router.push(`/dashboard/invoices/${data?.data?.invoice?._id}`);
        },
      });
    } else {
      updateOrder(
        {
          id: orderId,
          payload: values as UpdateInvoiceSchemaType,
        },
        {
          onSuccess: () => {
            router.push(`/dashboard/invoices/${orderId}`);
          },
        },
      );
    }
  };

  // Track selected products to fetch their details
  const selectedProductIds = useMemo(() => {
    return itemFields.map((_, index) => {
      const productId = form.watch(`items.${index}.product`);
      return productId || null;
    });
  }, [itemFields, form]);

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <FieldSet>
            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Invoice type</FieldLabel>
                  <Select
                    value={field.value ?? InvoiceType.ONLINE}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(InvoiceType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldSet>
        </FieldGroup>

        <FieldGroup>
          <FieldSet>
            <FieldLegend>Customer Information</FieldLegend>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field className="md:col-span-2">
                <FieldLabel>Select User (optional)</FieldLabel>
                <FieldDescription>
                  Search and select an existing user to auto-fill customer
                  information.
                </FieldDescription>
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
                      form.setValue("customer.email", user.email || undefined);
                      form.setValue("customer.phone", user.mobile || "");
                    } else {
                      form.setValue("customer.user", undefined);
                    }
                  }}
                  placeholder="Search users…"
                  debounceMs={300}
                  minQueryLength={1}
                  clearable
                />
              </Field>
              <Controller
                name="customer.name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="customer.name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="customer.name"
                      placeholder="Customer name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="customer.email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="customer.email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="customer.email"
                      type="email"
                      placeholder="customer@example.com"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="customer.phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="customer.phone">Phone</FieldLabel>
                    <Input
                      {...field}
                      id="customer.phone"
                      placeholder="+1234567890"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Order Items</FieldLegend>
            <FieldDescription>
              Add products to this order. Select product, variant (if
              applicable), and quantity. Price and discount are from the
              product/variant.
            </FieldDescription>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Product</TableHead>
                    <TableHead className="min-w-[140px]">Variant</TableHead>
                    <TableHead className="w-[90px]">Qty</TableHead>
                    <TableHead className="text-right w-[100px]">
                      Price
                    </TableHead>
                    <TableHead className="text-right w-[90px]">
                      Discount
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Total
                    </TableHead>
                    <TableHead className="w-[60px]" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`items.${index}.product`}
                          control={form.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <ComboboxApiSearch<ProductSearchOption>
                                searchFn={searchProducts}
                                getOptionLabel={(o) => o.name}
                                getOptionValue={(o) => o._id}
                                value={f.value || null}
                                onChange={(opt) => {
                                  const prevId = f.value;
                                  const id = opt
                                    ? (opt as ProductSearchOption)._id
                                    : "";
                                  f.onChange(id);
                                  form.setValue(
                                    `items.${index}.variantId` as `items.${number}.variantId`,
                                    undefined,
                                  );
                                  if (opt) {
                                    setProductOptionsCache((c) => ({
                                      ...c,
                                      [(opt as ProductSearchOption)._id]:
                                        opt as ProductSearchOption,
                                    }));
                                  } else if (prevId) {
                                    setProductOptionsCache((c) => {
                                      const next = { ...c };
                                      delete next[prevId];
                                      return next;
                                    });
                                  }
                                }}
                                renderOption={(option) => (
                                  <div className="flex w-full items-center gap-2">
                                    <div className="w-10">
                                      <AspectRatio
                                        ratio={1}
                                        className="rounded-md shrink-0"
                                      >
                                        {option.thumbnail?.path ? (
                                          <Image
                                            src={option.thumbnail?.path}
                                            alt={option.name}
                                            className="rounded-md shrink-0 object-cover"
                                            fill
                                          />
                                        ) : (
                                          <div className="size-full rounded-md bg-secondary border"></div>
                                        )}
                                      </AspectRatio>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="truncate">
                                        {option.name}
                                      </span>

                                      {option.hasVariants &&
                                      option.variants?.length ? (
                                        <span className="text-muted-foreground shrink-0 tabular-nums text-sm">
                                          {option.variants.length} variant
                                          {option.variants.length !== 1
                                            ? "s"
                                            : ""}
                                        </span>
                                      ) : option.sellingPrice != null ? (
                                        <span className="text-muted-foreground shrink-0 tabular-nums text-sm">
                                          {formatCurrency(option.sellingPrice)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                )}
                                placeholder="Search products…"
                                debounceMs={300}
                                minQueryLength={1}
                                clearable
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductVariantField
                          index={index}
                          form={form}
                          compact
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={form.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <Input
                                {...f}
                                type="number"
                                min={1}
                                className="h-8 w-20"
                                value={f.value ?? 1}
                                onChange={(e) =>
                                  f.onChange(Number(e.target.value) || 1)
                                }
                                aria-invalid={fieldState.invalid}
                                aria-label="Quantity"
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                      <LineItemPriceCell index={index} form={form} />
                      <TableCell className="text-right">
                        {itemFields.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(index)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <OrderItemsFooterTotals
                    form={form}
                    itemFields={itemFields}
                    productOptionsCache={productOptionsCache}
                  />
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="cursor-pointer"
                      onClick={() => appendItem(defaultItem)}
                    >
                      <span className="flex items-center justify-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Coupon & Notes</FieldLegend>
            <FieldGroup>
              <div className="flex gap-2 items-end">
                <Controller
                  name="coupon"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="flex-1 min-w-0"
                    >
                      <FieldLabel htmlFor="coupon">
                        Coupon Code (optional)
                      </FieldLabel>
                      <Input
                        {...field}
                        id="coupon"
                        placeholder="COUPON123"
                        value={field.value ?? ""}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={isCouponValidating}
                >
                  {isCouponValidating ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Tag className="size-4" />
                  )}
                </Button>
              </div>
              {discountAmount > 0 && (
                <p className="text-xs text-green-600">
                  Discount applied: {formatCurrency(discountAmount)}
                  {appliedFreeShipping && " (includes free shipping)"}
                </p>
              )}
              <Controller
                name="notes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                    <Textarea
                      {...field}
                      id="notes"
                      placeholder="Order notes"
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          {isCreate && (
            <>
              <FieldSeparator />
              <FieldSet>
                <FieldLegend>Payment information</FieldLegend>
                <FieldDescription>
                  Initial payment for this order. Amount will be validated
                  against the order total when the invoice is created.
                </FieldDescription>
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="transaction.paymentMethod"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Payment method *</FieldLabel>
                        <Select
                          value={field.value ?? PaymentMethod.CASH}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name={"transaction.reference" as const}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Reference (optional)</FieldLabel>
                        <Input
                          placeholder="e.g. transaction ID, phone number"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value.trim() || undefined)
                          }
                          onBlur={field.onBlur}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldSet>
            </>
          )}

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Order summary</FieldLegend>
            <FieldDescription>
              Preview of totals using current items, config (shipping, tax,
              COD), and applied coupon.
            </FieldDescription>
            <div className="rounded-md border bg-muted/30 p-4 space-y-2 text-sm max-w-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck className="size-3" />
                  Shipping
                </span>
                <span>
                  {appliedFreeShipping || !shippingAmount ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatCurrency(shippingAmount)
                  )}
                </span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="tabular-nums">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {codAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cash on delivery ({codAmount}%)
                  </span>
                  <span className="tabular-nums">{formatCurrency(codFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-baseline font-medium">
                <span>Total</span>
                <span className="tabular-nums text-base">
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Billing Address</FieldLegend>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="billingAddress.name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Name</FieldLabel>
                    <Input {...field} placeholder="Full name" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="billingAddress.email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@example.com"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="billingAddress.phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone</FieldLabel>
                    <Input {...field} placeholder="+1234567890" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />{" "}
              <Controller
                name="billingAddress.city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>City</FieldLabel>
                    <Input {...field} placeholder="City" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="billingAddress.state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>State</FieldLabel>
                    <Input {...field} placeholder="State" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="billingAddress.postalCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Postal Code</FieldLabel>
                    <Input {...field} placeholder="12345" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="billingAddress.address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="md:col-span-2"
                  >
                    <FieldLabel>Address</FieldLabel>
                    <Textarea {...field} placeholder="Street address" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Shipping Address</FieldLegend>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="shippingAddress.name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Name</FieldLabel>
                    <Input {...field} placeholder="Full name" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@example.com"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Phone</FieldLabel>
                    <Input {...field} placeholder="+1234567890" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>City</FieldLabel>
                    <Input {...field} placeholder="City" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>State</FieldLabel>
                    <Input {...field} placeholder="State" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.postalCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Postal Code</FieldLabel>
                    <Input {...field} placeholder="12345" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="shippingAddress.address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="md:col-span-2"
                  >
                    <FieldLabel>Address</FieldLabel>
                    <Textarea {...field} placeholder="Street address" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="mr-2" />}
              {isCreate ? "Create Order" : "Update Order"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
