"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { AssetSelectorField } from "@/components/ui/asset-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createOrUpdateSeoSchema,
  type CreateOrUpdateSeoSchemaType,
} from "@app/backend/schemas/seo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useGetSeo, useCreateOrUpdateSeo } from "@/hooks/api/seo";
import { TwitterCard } from "@app/backend/enums/seo";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default function SeoEditPage() {
  const { id } = useParams<{ id: string }>();

  const searchParams = useSearchParams();
  const type = searchParams.get("type")! as "category" | "product" | "page";

  const { data: res, isLoading } = useGetSeo(id, type);
  const seo = res?.data?.seo ?? null;

  const form = useForm<CreateOrUpdateSeoSchemaType>({
    resolver: zodResolver(createOrUpdateSeoSchema),
    defaultValues: {
      twitterCard: TwitterCard.SUMMARY_LARGE_IMAGE,
      type,
      id,
    },
  });

  useEffect(() => {
    if (seo)
      form.reset({
        ...seo,
        type,
        id,
        ogImage: undefined,
        deleteOgImage: false,
        twitterImage: undefined,
        deleteTwitterImage: false,
      });
  }, [seo, form]);

  const { mutate: createOrUpdateSeo, isPending } = useCreateOrUpdateSeo();

  const onSubmit = (values: CreateOrUpdateSeoSchemaType) => {
    if (!type || !id) return;
    createOrUpdateSeo(values);
  };

  if (!id) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Invalid SEO ID.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/dashboard/seo">Back to SEO</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-2">
        <Spinner />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl w-full mx-auto">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Meta</FieldLegend>
            <FieldDescription>
              Meta tags for search engines. All fields in this section are
              optional.
            </FieldDescription>
            <Controller
              name="metaTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Meta title (optional)</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="metaDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Meta description (optional)</FieldLabel>
                  <Textarea {...field} value={field.value ?? ""} rows={2} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="metaKeywords"
              control={form.control}
              render={({ field: { value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Meta keywords (optional)</FieldLabel>
                  <FieldDescription>
                    Comma-separated keywords for search.
                  </FieldDescription>
                  <Input
                    {...field}
                    value={value ?? ""}
                    placeholder="keyword1, keyword2"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="canonicalUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Canonical URL (optional)</FieldLabel>
                  <FieldDescription>
                    Preferred URL for this page to avoid duplicate content.
                  </FieldDescription>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://…"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <FieldDescription>
              Noindex: ask search engines not to index this page. Nofollow: ask
              them not to follow links. Both optional.
            </FieldDescription>
            <div className="flex flex-wrap gap-6">
              <Controller
                name="noindex"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="noindex"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="noindex" className="font-normal">
                      Noindex (optional)
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="nofollow"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="nofollow"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="nofollow" className="font-normal">
                      Nofollow (optional)
                    </FieldLabel>
                  </Field>
                )}
              />
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Open Graph</FieldLegend>
            <FieldDescription>
              Open Graph tags for link previews (e.g. social sharing). All
              optional.
            </FieldDescription>
            <Controller
              name="ogTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>OG title (optional)</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="ogDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>OG description (optional)</FieldLabel>
                  <Textarea {...field} value={field.value ?? ""} rows={2} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <FieldGroup>
              {seo?.ogImage?.path && !form.watch("deleteOgImage") && (
                <Field>
                  <FieldLabel>Current OG image</FieldLabel>
                  <div className="relative max-w-80">
                    <Image
                      src={seo.ogImage.path}
                      alt={seo.ogImage.name || "OG Image"}
                      className="rounded-md border object-cover relative!"
                      fill
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      onClick={() => form.setValue("deleteOgImage", true)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Field>
              )}
              {form.watch("deleteOgImage") && seo?.ogImage && (
                <FieldDescription>
                  OG image will be removed on save.
                </FieldDescription>
              )}
              <AssetSelectorField
                label="OG image (optional)"
                description="Select from library or upload. Used in link previews."
                value={form.watch("ogImage") ?? null}
                onChange={(v) => {
                  if (typeof v === "string" && v) form.setValue("ogImage", v);
                  else {
                    form.setValue("ogImage", undefined);
                    form.setValue("deleteOgImage", true);
                  }
                }}
                multiple={false}
              />
              {form.formState.errors.ogImage && (
                <FieldError errors={[form.formState.errors.ogImage]} />
              )}
            </FieldGroup>
            <Controller
              name="ogType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>OG type (optional)</FieldLabel>
                  <FieldDescription>
                    e.g. website, article, product. Defaults to website.
                  </FieldDescription>
                  <Input {...field} value={field.value ?? "website"} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldSet>

          <FieldSet>
            <FieldLegend>Twitter</FieldLegend>
            <FieldDescription>
              Twitter card fields for tweet previews. All optional.
            </FieldDescription>
            <Controller
              name="twitterCard"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Twitter card (optional)</FieldLabel>
                  <FieldDescription>
                    Card layout (e.g. summary_large_image for a big image).
                  </FieldDescription>
                  <Select
                    value={field.value ?? "summary_large_image"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">summary</SelectItem>
                      <SelectItem value="summary_large_image">
                        summary_large_image
                      </SelectItem>
                      <SelectItem value="app">app</SelectItem>
                      <SelectItem value="player">player</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="twitterTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Twitter title (optional)</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="twitterDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Twitter description (optional)</FieldLabel>
                  <Textarea {...field} value={field.value ?? ""} rows={2} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <FieldGroup>
              {seo?.twitterImage?.path && !form.watch("deleteTwitterImage") && (
                <Field>
                  <FieldLabel>Current Twitter image</FieldLabel>
                  <div className="relative max-w-80">
                    <Image
                      src={seo.twitterImage.path}
                      alt={seo.twitterImage.name || "Twitter Image"}
                      className="rounded-md border object-cover relative!"
                      fill
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      onClick={() => form.setValue("deleteTwitterImage", true)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Field>
              )}
              {form.watch("deleteTwitterImage") && seo?.twitterImage && (
                <FieldDescription>
                  Twitter image will be removed on save.
                </FieldDescription>
              )}
              <AssetSelectorField
                label="Twitter image (optional)"
                description="Select from library or upload. Used in tweet previews."
                value={form.watch("twitterImage") ?? null}
                onChange={(v) => {
                  if (typeof v === "string" && v)
                    form.setValue("twitterImage", v);
                  else {
                    form.setValue("twitterImage", undefined);
                    form.setValue("deleteTwitterImage", true);
                  }
                }}
                multiple={false}
              />
              {form.formState.errors.twitterImage && (
                <FieldError errors={[form.formState.errors.twitterImage]} />
              )}
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Structured data (JSON)</FieldLegend>
            <FieldDescription>
              Optional JSON-LD for rich results in search. Must be valid JSON.
            </FieldDescription>
            <Controller
              name="structuredData"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>JSON-LD (optional)</FieldLabel>
                  <Textarea
                    value={
                      typeof field.value === "object" && field.value !== null
                        ? JSON.stringify(field.value, null, 2)
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        field.onChange(undefined);
                        return;
                      }
                      try {
                        field.onChange(
                          JSON.parse(raw) as Record<string, unknown>,
                        );
                      } catch {
                        field.onChange(undefined);
                      }
                    }}
                    rows={6}
                    placeholder='{"@context": "https://schema.org", …}'
                    className="font-mono text-sm"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldSet>
        </FieldGroup>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
