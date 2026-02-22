"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createProductSchema,
  CreateProductSchemaType,
  updateProductSchema,
  UpdateProductSchemaType,
} from "@repo/common/schemas/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetSelectorField } from "@/components/ui/asset-selector";
import { ComboboxApiSearch } from "@/components/ui/combobox-api-search";
import { useCategorySearch } from "@/hooks/use-category-search";
import {
  useGetProduct,
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/api/products";
import type { ProductDetail } from "@/hooks/api/products";
import { cn } from "@/lib/utils";
import { Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { DiscountType } from "@repo/common/enums/discount";
import Image from "next/image";
import PlateEditor from "@/components/plugins/editor";
import { useConfigContext } from "@/contexts/config";

type ProductFormValues = Omit<
  CreateProductSchemaType,
  "hasVariants" | "featured" | "variants"
> & {
  hasVariants: boolean;
  featured: boolean;
  category: string;
  subcategory: string;
  isDeleteThumbnail?: boolean;
  deleteImages?: string[];
  thumbnail?: string | null;
  images?: string[];
  videoLink?: string | null;
  variants?: UpdateProductSchemaType["variants"];
};

type VariantFormValues = NonNullable<ProductFormValues["variants"]>[number];

const defaultVariant: VariantFormValues = {
  status: true,
  sku: "",
  name: "",
  images: [],
  buyingPrice: 0,
  sellingPrice: 0,
  discountType: DiscountType.PERCENTAGE,
  discountValue: 0,
  weight: 0,
  weightUnit: "",
  unit: "",
  minQuantity: 0,
  maxQuantity: 0,
  stock: 0,
};

const defaultValues: ProductFormValues = {
  name: "",
  slug: "",
  description: null as ProductFormValues["description"],
  category: "",
  subcategory: "",
  thumbnail: undefined,
  images: [],
  videoLink: undefined,
  hasVariants: false,
  buyingPrice: undefined,
  sellingPrice: undefined,
  discountType: DiscountType.PERCENTAGE,
  discountValue: undefined,
  weight: undefined,
  weightUnit: "",
  unit: "",
  minQuantity: undefined,
  maxQuantity: undefined,
  stock: undefined,
  sku: "",
  variants: [],
  featured: false,
  faqs: [],
  isDeleteThumbnail: false,
  deleteImages: [],
  status: true,
};

function productToFormValues(p: ProductDetail): Partial<ProductFormValues> {
  const categoryId =
    typeof p.category === "object" ? p.category?._id : p.category;
  const subcategoryId =
    typeof p.subcategory === "object" ? p.subcategory?._id : p.subcategory;
  const variants = Array.isArray(p.variants)
    ? p.variants.map((v: any) => ({
        status: v.status ?? true,
        sku: v.sku ?? undefined,
        name: v.name ?? "",
        images: undefined,
        buyingPrice: v.buyingPrice,
        sellingPrice: v.sellingPrice,
        discountType: v.discountType ?? DiscountType.PERCENTAGE,
        discountValue: v.discountValue ?? undefined,
        weight: v.weight ?? 0,
        weightUnit: v.weightUnit ?? "",
        unit: v.unit ?? "",
        minQuantity: v.minQuantity ?? undefined,
        maxQuantity: v.maxQuantity ?? undefined,
        stock: v.stock,
      }))
    : [];
  const faqs = Array.isArray(p.faqs)
    ? p.faqs.map((f) => ({
        question: f.question ?? "",
        answer: f.answer ?? "",
      }))
    : [];
  return {
    name: p.name ?? "",
    slug: p.slug ?? "",
    description: p.description,
    category: categoryId ?? "",
    subcategory: subcategoryId ?? "",
    hasVariants: p.hasVariants ?? false,
    buyingPrice: p.buyingPrice ?? undefined,
    sellingPrice: p.sellingPrice ?? undefined,
    discountType: p.discountType ?? DiscountType.PERCENTAGE,
    discountValue: p.discountValue ?? undefined,
    weight: p.weight ?? undefined,
    weightUnit: p.weightUnit ?? "",
    unit: p.unit ?? "",
    minQuantity: p.minQuantity ?? undefined,
    maxQuantity: p.maxQuantity ?? undefined,
    stock: p.stock ?? undefined,
    sku: p.sku ?? "",
    variants,
    featured: p.featured ?? false,
    faqs,
    isDeleteThumbnail: false,
    deleteImages: [],
    thumbnail: undefined,
    images: [],
    videoLink: p.videoLink ?? undefined,
    status: p.status ?? true,
  };
}

export default function AddEditProduct({ id }: { id: string }) {
  const isCreate = id === "create";
  const router = useRouter();
  const { config } = useConfigContext();
  const currency = config?.currency ?? "BDT";

  const {
    data: productData,
    isLoading: loadingProduct,
    error: productError,
  } = useGetProduct(isCreate ? null : id);
  const product = productData?.data?.product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(
      isCreate ? createProductSchema : updateProductSchema,
    ) as Resolver<ProductFormValues>,
    defaultValues,
  });

  console.log(form.formState.errors);

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const isPending = isCreating || isUpdating;

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control: form.control,
    name: "faqs",
  });

  const hasVariants = form.watch("hasVariants");
  useEffect(() => {
    if (hasVariants && !form.watch("variants")?.length) {
      appendVariant(defaultVariant);
      form.setValue("buyingPrice", undefined);
      form.setValue("sellingPrice", undefined);
      form.setValue("discountValue", undefined);
      form.setValue("weight", undefined);
      form.setValue("weightUnit", undefined);
      form.setValue("unit", undefined);
      form.setValue("minQuantity", undefined);
      form.setValue("maxQuantity", undefined);
      form.setValue("stock", undefined);
      form.setValue("sku", undefined);
    }

    if (!hasVariants && form.watch("variants")?.length) {
      form.setValue("variants", undefined);
    }
  }, [hasVariants, appendVariant, form]);

  useEffect(() => {
    if (!isCreate && product) {
      form.reset({
        ...defaultValues,
        ...productToFormValues(product),
      });
    } else if (isCreate) {
      form.reset(defaultValues);
    }
  }, [isCreate, product, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (isCreate && nameValue.trim()) {
      const slug = nameValue
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      if (slug) form.setValue("slug", slug);
    }
  }, [isCreate, nameValue, form]);

  const categoryId = form.watch("category");
  useEffect(() => {
    if (!isCreate) return;
    if (!categoryId) form.setValue("subcategory", "");
  }, [categoryId, isCreate, form]);

  const searchParentCategories = useCategorySearch({
    type: "parent",
    limit: 10,
  });
  const searchSubcategories = useCategorySearch({
    type: "child",
    limit: 10,
    parentId: categoryId || null,
  });

  const onSubmit = (values: ProductFormValues) => {
    if (isCreate) {
      createProduct(values as CreateProductSchemaType, {
        onSuccess: (data) => {
          const newId = (data as { data?: { product?: { _id?: string } } })
            ?.data?.product?._id;
          if (newId) router.push(`/dashboard/products/${newId}`);
        },
      });
    } else {
      updateProduct(
        {
          id,
          payload: {
            ...values,
            isDeleteThumbnail: values.isDeleteThumbnail ?? undefined,
            deleteImages: values.deleteImages?.length
              ? values.deleteImages
              : undefined,
          } as UpdateProductSchemaType,
        },
        {
          // onSuccess: () => router.push(`/dashboard/products`),
        },
      );
    }
  };

  if (!isCreate && loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!isCreate && productError) {
    return (
      <div className="p-4">
        <p className="text-destructive">Product not found.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/dashboard/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl w-full mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {isCreate ? "Create Product" : "Edit Product"}
        </h1>
        {!isCreate && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/seo/${id}?type=product`}>
              <Search className="mr-2 size-4" />
              {product?.seo ? "Edit SEO" : "Add SEO"}
            </Link>
          </Button>
        )}
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Product details</FieldLegend>
            <FieldDescription>
              Basic name, slug and description for the product.
            </FieldDescription>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      placeholder="Name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="slug">Slug</FieldLabel>
                    <Input
                      {...field}
                      id="slug"
                      placeholder="Slug"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="description">
                      Description (optional)
                    </FieldLabel>
                    <div>
                      <PlateEditor
                        onChange={field.onChange}
                        value={product?.description}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="videoLink"
                control={form.control}
                render={({ field: { value, ...rest }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="videoLink">
                      Video link (optional)
                    </FieldLabel>
                    <Input
                      {...rest}
                      id="videoLink"
                      type="url"
                      value={value ?? ""}
                      placeholder="https://www.youtube.com/watch?v=..."
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
            <FieldLegend>Category &amp; media</FieldLegend>
            <FieldDescription>
              Choose category, subcategory and upload images.
            </FieldDescription>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2">
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Category</FieldLabel>
                    <ComboboxApiSearch<{
                      _id: string;
                      name: string;
                      label: string;
                      value: string;
                    }>
                      searchFn={searchParentCategories}
                      getOptionLabel={(o) => o.name}
                      getOptionValue={(o) => o._id}
                      value={field.value ? String(field.value) : null}
                      onChange={(opt) => {
                        const id = opt ? opt._id : "";
                        form.setValue("category", id as never);
                      }}
                      placeholder="Search category…"
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
              <Controller
                name="subcategory"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Subcategory</FieldLabel>
                    <ComboboxApiSearch<{
                      _id: string;
                      name: string;
                      label: string;
                      value: string;
                    }>
                      searchFn={searchSubcategories}
                      getOptionLabel={(o) => o.name}
                      getOptionValue={(o) => o._id}
                      value={field.value ? String(field.value) : null}
                      onChange={(opt) => {
                        const id = opt ? opt._id : "";
                        form.setValue("subcategory", id as never);
                      }}
                      placeholder="Search subcategory…"
                      debounceMs={300}
                      minQueryLength={1}
                      clearable
                      disabled={!categoryId}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              {!isCreate &&
                product?.thumbnail?.path &&
                !form.watch("isDeleteThumbnail") && (
                  <Field className="max-w-80">
                    <FieldLabel>Current thumbnail</FieldLabel>
                    <div className="relative">
                      <Image
                        src={product.thumbnail.path}
                        alt={product.thumbnail.name || "Thumbnail"}
                        className="rounded-md border object-cover relative!"
                        fill
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2"
                        onClick={() => form.setValue("isDeleteThumbnail", true)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Field>
                )}
              {!isCreate &&
                form.watch("isDeleteThumbnail") &&
                product?.thumbnail && (
                  <p className="text-muted-foreground text-sm">
                    Thumbnail will be removed on save.
                  </p>
                )}
              {!isCreate && !!product?.images?.length && (
                <Field>
                  <FieldLabel>Current images</FieldLabel>
                  <div className="flex flex-wrap gap-3">
                    {(product?.images).map((img) => {
                      const toDelete = (
                        form.watch("deleteImages") ?? []
                      ).includes(img._id);
                      return (
                        <div key={img._id} className={"relative"}>
                          <Image
                            src={img.path}
                            alt={img.name ?? "Image"}
                            className={cn(
                              "rounded-md border object-cover relative! size-20!",
                              toDelete && "opacity-50",
                            )}
                            fill
                          />
                          <Button
                            type="button"
                            variant={toDelete ? "outline" : "destructive"}
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => {
                              const current =
                                form.getValues("deleteImages") ?? [];
                              if (current.includes(img._id)) {
                                form.setValue(
                                  "deleteImages",
                                  current.filter((id) => id !== img._id),
                                );
                              } else {
                                form.setValue("deleteImages", [
                                  ...current,
                                  img._id,
                                ]);
                              }
                            }}
                            aria-label={
                              toDelete ? "Undo remove image" : "Remove image"
                            }
                          >
                            {toDelete ? (
                              <RotateCcw className="size-3" />
                            ) : (
                              <Trash2 className="size-3" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {(form.watch("deleteImages") ?? []).length > 0 && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {form.watch("deleteImages")?.length} image(s) will be
                      removed on save.
                    </p>
                  )}
                </Field>
              )}
              <AssetSelectorField
                label="Thumbnail"
                description="Select from library or upload a new image."
                value={form.watch("thumbnail") ?? null}
                onChange={(v) => {
                  if (typeof v === "string" && v) {
                    form.setValue("thumbnail", v);
                  } else {
                    form.setValue("thumbnail", undefined);
                    form.setValue("isDeleteThumbnail", true);
                  }
                }}
                multiple={false}
              />
              <AssetSelectorField
                label="Product images"
                description="Select from library or upload new images."
                value={form.watch("images") ?? []}
                onChange={(v) =>
                  form.setValue("images", Array.isArray(v) ? v : v ? [v] : [])
                }
                multiple
                maxSelection={10}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Pricing</FieldLegend>
            <FieldDescription>
              Set whether the product has variants, then enter prices and stock.
            </FieldDescription>
            <FieldGroup>
              <Controller
                name="hasVariants"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="hasVariants"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldLabel htmlFor="hasVariants" className="font-normal">
                      Has variants
                    </FieldLabel>
                  </Field>
                )}
              />

              {!hasVariants && (
                <FieldGroup className="grid xs:grid-cols-2 lg:grid-cols-4">
                  <Controller
                    name="buyingPrice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="buyingPrice">
                          Buying price
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="buyingPrice"
                            type="number"
                            min={0}
                            step="0.01"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                          <InputGroupAddon align="inline-start">
                            <InputGroupText>{currency}</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="sellingPrice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="sellingPrice">
                          Selling price
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="sellingPrice"
                            type="number"
                            min={0}
                            step="0.01"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                          <InputGroupAddon align="inline-start">
                            <InputGroupText>{currency}</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="stock"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="stock">Stock</FieldLabel>
                        <Input
                          {...field}
                          id="stock"
                          type="number"
                          min={0}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="weight"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="weight">Weight</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="weight"
                            type="number"
                            min={0}
                            step="0.01"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>
                              {form.watch("weightUnit") || "kg"}
                            </InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="weightUnit"
                    control={form.control}
                    render={({ field: { value, ...field }, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="weightUnit">
                          Weight unit
                        </FieldLabel>
                        <Input
                          {...field}
                          value={value ?? ""}
                          id="weightUnit"
                          placeholder="e.g. kg, g"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="unit"
                    control={form.control}
                    render={({ field: { value, ...field }, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="unit">Unit</FieldLabel>
                        <Input
                          {...field}
                          value={value ?? ""}
                          id="unit"
                          placeholder="e.g. pcs, box"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="minQuantity"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="minQuantity">
                          Min order quantity
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="minQuantity"
                            type="number"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="maxQuantity"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="maxQuantity">
                          Max order quantity
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            id="maxQuantity"
                            type="number"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="sku"
                    control={form.control}
                    render={({ field: { value, ...field }, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="sku">SKU (optional)</FieldLabel>
                        <Input
                          {...field}
                          value={value ?? ""}
                          id="sku"
                          placeholder="SKU"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="discountValue"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Discount</FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            type="number"
                            value={field.value || 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                          />
                          <InputGroupAddon align="inline-end">
                            <Controller
                              name="discountType"
                              control={form.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value ?? undefined}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger
                                    className="border-none ring-0! px-0"
                                    size="sm"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={DiscountType.PERCENTAGE}>
                                      Percentage
                                    </SelectItem>
                                    <SelectItem value={DiscountType.FIXED}>
                                      Fixed
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              )}

              {hasVariants && (
                <Field data-invalid={form.formState.errors.variants?.message}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel>Variants</FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendVariant(defaultVariant)}
                    >
                      <Plus className="size-4" />
                      Add variant
                    </Button>
                  </div>
                  <FieldDescription>
                    Add at least one variant with SKU, prices and stock.
                  </FieldDescription>
                  {!!form.watch("variants")?.length && (
                    <div className="space-y-4 mt-2">
                      {variantFields.map((variantField, index) => (
                        <div
                          key={variantField.id}
                          className="rounded-md border bg-card p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Variant {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeVariant(index)}
                              disabled={variantFields.length <= 1}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Remove variant</span>
                            </Button>
                          </div>
                          <FieldGroup className="grid xs:grid-cols-2 lg:grid-cols-4">
                            <Controller
                              name={`variants.${index}.name`}
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>Variant name</FieldLabel>
                                  <Input
                                    {...field}
                                    placeholder="Variant name"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.sku`}
                              control={form.control}
                              render={({
                                field: { value, ...field },
                                fieldState,
                              }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>SKU (optional)</FieldLabel>
                                  <Input
                                    {...field}
                                    value={value ?? ""}
                                    placeholder="SKU"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.buyingPrice`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Buying price</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={f.value || ""}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        )
                                      }
                                    />
                                    <InputGroupAddon align="inline-start">
                                      <InputGroupText>
                                        {currency}
                                      </InputGroupText>
                                    </InputGroupAddon>
                                  </InputGroup>
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.sellingPrice`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Selling price</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={f.value || ""}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        )
                                      }
                                    />
                                    <InputGroupAddon align="inline-start">
                                      <InputGroupText>
                                        {currency}
                                      </InputGroupText>
                                    </InputGroupAddon>
                                  </InputGroup>
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.stock`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Stock</FieldLabel>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={f.value || ""}
                                    onChange={(e) =>
                                      f.onChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : 0,
                                      )
                                    }
                                  />
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.weight`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Weight</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={f.value || ""}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        )
                                      }
                                    />
                                    <InputGroupAddon align="inline-end">
                                      <InputGroupText>
                                        {form.watch(
                                          `variants.${index}.weightUnit`,
                                        ) || "kg"}
                                      </InputGroupText>
                                    </InputGroupAddon>
                                  </InputGroup>
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.weightUnit`}
                              control={form.control}
                              render={({
                                field: { value, ...field },
                                fieldState: fs,
                              }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Weight unit</FieldLabel>
                                  <Input
                                    {...field}
                                    value={value ?? ""}
                                    placeholder="e.g. kg, g"
                                  />
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.unit`}
                              control={form.control}
                              render={({
                                field: { value, ...field },
                                fieldState: fs,
                              }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Unit</FieldLabel>
                                  <Input
                                    {...field}
                                    value={value ?? ""}
                                    placeholder="e.g. pcs, box"
                                  />
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.minQuantity`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Min order quantity</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      value={f.value || ""}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        )
                                      }
                                    />
                                  </InputGroup>
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.maxQuantity`}
                              control={form.control}
                              render={({ field: f, fieldState: fs }) => (
                                <Field data-invalid={fs.invalid}>
                                  <FieldLabel>Max order quantity</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      value={f.value || ""}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : 0,
                                        )
                                      }
                                    />
                                  </InputGroup>
                                  {fs.invalid && (
                                    <FieldError errors={[fs.error]} />
                                  )}
                                </Field>
                              )}
                            />
                            <Controller
                              name={`variants.${index}.discountValue`}
                              control={form.control}
                              render={({ field }) => (
                                <Field>
                                  <FieldLabel>Discount</FieldLabel>
                                  <InputGroup>
                                    <InputGroupInput
                                      type="number"
                                      min={0}
                                      value={field.value || 0}
                                      onChange={(e) =>
                                        field.onChange(
                                          Number(e.target.value) || 0,
                                        )
                                      }
                                    />
                                    <InputGroupAddon align="inline-end">
                                      <Controller
                                        name={`variants.${index}.discountType`}
                                        control={form.control}
                                        render={({ field }) => (
                                          <Select
                                            value={field.value ?? undefined}
                                            onValueChange={field.onChange}
                                          >
                                            <SelectTrigger
                                              className="border-none ring-0! px-0"
                                              size="sm"
                                            >
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem
                                                value={DiscountType.PERCENTAGE}
                                              >
                                                Percentage
                                              </SelectItem>
                                              <SelectItem
                                                value={DiscountType.FIXED}
                                              >
                                                Fixed
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                    </InputGroupAddon>
                                  </InputGroup>
                                </Field>
                              )}
                            />
                          </FieldGroup>
                          <FieldGroup>
                            {!isCreate &&
                              !!product?.variants?.[index]?.images?.length && (
                                <Field>
                                  <FieldLabel>Current images</FieldLabel>
                                  <div className="flex flex-wrap gap-3">
                                    {(product?.variants?.[index]?.images).map(
                                      (img) => {
                                        const toDelete = (
                                          form.watch(
                                            `variants.${index}.deleteImages`,
                                          ) || []
                                        )?.includes(img._id);
                                        return (
                                          <div
                                            key={img._id}
                                            className={"relative"}
                                          >
                                            <Image
                                              src={img.path}
                                              alt={img.name ?? "Image"}
                                              className={cn(
                                                "rounded-md border object-cover relative! size-20!",
                                                toDelete && "opacity-50",
                                              )}
                                              fill
                                            />
                                            <Button
                                              type="button"
                                              variant={
                                                toDelete
                                                  ? "outline"
                                                  : "destructive"
                                              }
                                              size="sm"
                                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                              onClick={() => {
                                                const current =
                                                  form.getValues(
                                                    `variants.${index}.deleteImages`,
                                                  ) || [];
                                                if (
                                                  current?.includes(img._id)
                                                ) {
                                                  form.setValue(
                                                    `variants.${index}.deleteImages`,
                                                    current.filter(
                                                      (id) => id !== img._id,
                                                    ),
                                                  );
                                                } else {
                                                  form.setValue(
                                                    `variants.${index}.deleteImages`,
                                                    [...current, img._id],
                                                  );
                                                }
                                              }}
                                              aria-label={
                                                toDelete
                                                  ? "Undo remove image"
                                                  : "Remove image"
                                              }
                                            >
                                              {toDelete ? (
                                                <RotateCcw className="size-3" />
                                              ) : (
                                                <Trash2 className="size-3" />
                                              )}
                                            </Button>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                  {(
                                    form.watch(
                                      `variants.${index}.deleteImages`,
                                    ) || []
                                  ).length > 0 && (
                                    <p className="text-muted-foreground text-sm mt-1">
                                      {
                                        form.watch(
                                          `variants.${index}.deleteImages`,
                                        )?.length
                                      }{" "}
                                      image(s) will be removed on save.
                                    </p>
                                  )}
                                </Field>
                              )}
                            <AssetSelectorField
                              label="Variant images"
                              description="Select images for this variant."
                              value={
                                (form.watch(`variants.${index}.images`) as
                                  | string[]
                                  | undefined) ?? []
                              }
                              onChange={(v) =>
                                form.setValue(
                                  `variants.${index}.images`,
                                  Array.isArray(v) ? v : v ? [v] : [],
                                )
                              }
                              multiple
                              maxSelection={10}
                            />
                          </FieldGroup>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.formState.errors.variants && (
                    <FieldError errors={[form.formState.errors.variants]} />
                  )}
                </Field>
              )}
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Product status</FieldLegend>
            <FieldDescription>Set the status of the product.</FieldDescription>
            <FieldGroup>
              <Controller
                name="featured"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="featured" className="font-normal">
                      Featured (optional)
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="status"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="status" className="font-normal">
                      Status
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>FAQs (optional)</FieldLegend>
            <FieldDescription>
              Add frequently asked questions and answers for this product.
            </FieldDescription>
            <FieldGroup>
              <div className="space-y-4">
                {faqFields.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        FAQ #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFaq(index)}
                        aria-label="Remove FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Controller
                      name={`faqs.${index}.question`}
                      control={form.control}
                      render={({ field: f, fieldState: fs }) => (
                        <Field data-invalid={fs.invalid}>
                          <FieldLabel>Question</FieldLabel>
                          <Input
                            {...f}
                            placeholder="Question"
                            aria-invalid={fs.invalid}
                          />
                          {fs.invalid && <FieldError errors={[fs.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`faqs.${index}.answer`}
                      control={form.control}
                      render={({ field: f, fieldState: fs }) => (
                        <Field data-invalid={fs.invalid}>
                          <FieldLabel>Answer</FieldLabel>
                          <Textarea
                            {...f}
                            placeholder="Answer"
                            rows={2}
                            aria-invalid={fs.invalid}
                          />
                          {fs.invalid && <FieldError errors={[fs.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendFaq({ question: "", answer: "" })}
                  className="w-fit"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add FAQ
                </Button>
              </div>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>

        <Field orientation="horizontal" className="mt-6 gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            {isCreate ? "Create" : "Update"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/products">Cancel</Link>
          </Button>
        </Field>
      </form>
    </div>
  );
}
