"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfigContext } from "@/contexts/config";
import { useUpdateConfig, type ConfigData } from "@/hooks/api/config";
import { AssetSelectorField } from "@/components/ui/asset-selector";
import {
  updateConfigSchema,
  type UpdateConfigSchemaType,
} from "@repo/common/schemas/config";
import { TwitterCard } from "@repo/common/enums/seo";
import Image from "next/image";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const SOCIAL_KEYS = [
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
] as const;

function toFormValues(c: ConfigData | null): UpdateConfigSchemaType {
  const baseSocials: NonNullable<UpdateConfigSchemaType["socials"]> = {};
  for (const { key, label } of SOCIAL_KEYS) {
    const existing = c?.socials?.[key];
    baseSocials[key] = {
      name: existing?.name ?? label,
      url: existing?.url ?? "",
    };
  }

  const seo = c?.seo;

  if (!c) {
    return {
      currency: "BDT",
      taxAmount: 0,
      shippingAmount: 0,
      codAmount: 0,
      siteName: "My Store",
      siteDescription: "",
      siteLogo: null,
      siteFavicon: null,
      siteEmail: "",
      sitePhone: "",
      siteAddress: "",
      siteUrl: "",
      socials: baseSocials,
      seo: {
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        canonicalUrl: "",
        noindex: false,
        nofollow: false,
        ogTitle: "",
        ogDescription: "",
        ogImage: null,
        ogType: "",
        twitterCard: undefined,
        twitterTitle: "",
        twitterDescription: "",
        twitterImage: null,
        structuredData: undefined,
      },
    };
  }

  return {
    currency: c.currency ?? "BDT",
    taxAmount: c.taxAmount ?? 0,
    shippingAmount: c.shippingAmount ?? 0,
    codAmount: c.codAmount ?? 0,
    siteName: c.siteName ?? "My Store",
    siteDescription: c.siteDescription ?? "",
    siteLogo: c.siteLogo?._id?.toString() ?? null,
    siteFavicon: c.siteFavicon?._id?.toString() ?? null,
    siteEmail: c.siteEmail ?? "",
    sitePhone: c.sitePhone ?? "",
    siteAddress: c.siteAddress ?? "",
    siteUrl: c.siteUrl ?? "",
    socials: baseSocials,
    seo: seo
      ? {
          metaTitle: seo.metaTitle ?? "",
          metaDescription: seo.metaDescription ?? "",
          metaKeywords: seo.metaKeywords ?? "",
          canonicalUrl: seo.canonicalUrl ?? "",
          noindex: seo.noindex ?? false,
          nofollow: seo.nofollow ?? false,
          ogTitle: seo.ogTitle ?? "",
          ogDescription: seo.ogDescription ?? "",
          ogImage: (seo.ogImage as any)?._id?.toString() ?? null,
          ogType: seo.ogType ?? "",
          twitterCard: seo.twitterCard as TwitterCard | undefined,
          twitterTitle: seo.twitterTitle ?? "",
          twitterDescription: seo.twitterDescription ?? "",
          twitterImage: (seo.twitterImage as any)?._id?.toString() ?? null,
          structuredData: seo.structuredData as Record<string, any> | undefined,
        }
      : {
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          canonicalUrl: "",
          noindex: false,
          nofollow: false,
          ogTitle: "",
          ogDescription: "",
          ogImage: null,
          ogType: "",
          twitterCard: undefined,
          twitterTitle: "",
          twitterDescription: "",
          twitterImage: null,
          structuredData: undefined,
        },
  };
}

function toPayload(values: UpdateConfigSchemaType): UpdateConfigSchemaType {
  const socials: NonNullable<UpdateConfigSchemaType["socials"]> = {};
  if (values.socials) {
    for (const [key, v] of Object.entries(values.socials)) {
      const url = v?.url?.trim();
      if (url) {
        socials[key] = {
          name: (v.name ?? key).trim() || key,
          url,
        };
      }
    }
  }

  const siteLogo = values.siteLogo ?? null;
  const siteFavicon = values.siteFavicon ?? null;

  const seoData = values.seo
    ? {
        metaTitle: values.seo.metaTitle?.trim() || undefined,
        metaDescription: values.seo.metaDescription?.trim() || undefined,
        metaKeywords: values.seo.metaKeywords?.trim() || undefined,
        canonicalUrl: values.seo.canonicalUrl?.trim() || undefined,
        noindex: values.seo.noindex ?? undefined,
        nofollow: values.seo.nofollow ?? undefined,
        ogTitle: values.seo.ogTitle?.trim() || undefined,
        ogDescription: values.seo.ogDescription?.trim() || undefined,
        ogImage: values.seo.ogImage?.trim() || undefined,
        deleteOgImage: values.seo.deleteOgImage ?? undefined,
        ogType: values.seo.ogType?.trim() || undefined,
        twitterCard: values.seo.twitterCard ?? undefined,
        twitterTitle: values.seo.twitterTitle?.trim() || undefined,
        twitterDescription: values.seo.twitterDescription?.trim() || undefined,
        twitterImage: values.seo.twitterImage?.trim() || undefined,
        deleteTwitterImage: values.seo.deleteTwitterImage ?? undefined,
        structuredData: values.seo.structuredData ?? undefined,
      }
    : undefined;

  // Only include SEO if at least one field has a value
  const hasSeoData =
    seoData &&
    Object.values(seoData).some(
      (v) => v !== undefined && v !== null && v !== "",
    );
  const seo = hasSeoData ? seoData : undefined;

  return {
    currency: values.currency?.trim() || undefined,
    taxAmount:
      typeof values.taxAmount === "number" ? values.taxAmount : undefined,
    codAmount:
      typeof values.codAmount === "number" ? values.codAmount : undefined,
    shippingAmount:
      typeof values.shippingAmount === "number"
        ? values.shippingAmount
        : undefined,
    siteName: values.siteName?.trim() || undefined,
    siteDescription: values.siteDescription?.trim() || undefined,
    siteLogo: siteLogo || null,
    siteFavicon: siteFavicon || null,
    siteEmail: values.siteEmail?.trim() || undefined,
    sitePhone: values.sitePhone?.trim() || undefined,
    siteAddress: values.siteAddress?.trim() || undefined,
    siteUrl: values.siteUrl?.trim() || undefined,
    socials: Object.keys(socials).length > 0 ? socials : undefined,
    seo,
  };
}

export default function SettingsPage() {
  const { config, isConfigLoading } = useConfigContext();
  const { mutate: updateConfig, isPending: isSaving } = useUpdateConfig();

  const form = useForm<UpdateConfigSchemaType>({
    resolver: zodResolver(updateConfigSchema),
    defaultValues: toFormValues(config),
  });

  useEffect(() => {
    form.reset(toFormValues(config));
  }, [config, form]);

  const handleSubmit = (values: UpdateConfigSchemaType) => {
    updateConfig(toPayload(values));
  };

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        <FieldGroup>
          <FieldSet>
            <FieldLegend>Store defaults</FieldLegend>
            <FieldDescription>
              Default currency and amounts used for orders and invoices.
            </FieldDescription>
            <FieldGroup className="grid gap-4 xs:grid-cols-2 lg:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Input
                  id="currency"
                  {...form.register("currency")}
                  placeholder="e.g. BDT"
                />
              </Field>
              {/* <Field>
                <FieldLabel htmlFor="taxAmount">Default tax amount</FieldLabel>
                <Input
                  id="taxAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register("taxAmount", { valueAsNumber: true })}
                />
              </Field> */}
              <Field>
                <FieldLabel htmlFor="shippingAmount">
                  Default shipping amount
                </FieldLabel>
                <Input
                  id="shippingAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register("shippingAmount", { valueAsNumber: true })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="codAmount">Default COD amount</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="codAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    {...form.register("codAmount", { valueAsNumber: true })}
                  />
                  <InputGroupAddon align="inline-end">%</InputGroupAddon>
                </InputGroup>
                <FieldError errors={[form.formState.errors.codAmount]} />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Site information</FieldLegend>
            <FieldGroup className="grid sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="siteName">Site name</FieldLabel>
                <Input
                  id="siteName"
                  {...form.register("siteName")}
                  placeholder="My Store"
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="siteDescription">
                  Site description
                </FieldLabel>
                <Textarea
                  id="siteDescription"
                  {...form.register("siteDescription")}
                  placeholder="Short description of your store"
                  rows={2}
                />
              </Field>
            </FieldGroup>
            <FieldGroup className="flex flex-row flex-wrap">
              <Field className="w-auto">
                <FieldLabel>Site logo</FieldLabel>
                {config?.siteLogo?.path && (
                  <div className="relative">
                    <Image
                      src={config.siteLogo.path}
                      alt={config.siteLogo.name || "Logo"}
                      className="rounded-md border object-cover relative! max-w-80!"
                      fill
                    />
                  </div>
                )}
                <AssetSelectorField
                  value={form.watch("siteLogo") || null}
                  onChange={(v) =>
                    form.setValue("siteLogo", typeof v === "string" ? v : null)
                  }
                  placeholder="Select logo"
                />
              </Field>
              <Field className="w-auto">
                <FieldLabel>Favicon</FieldLabel>
                <AssetSelectorField
                  value={form.watch("siteFavicon") || null}
                  onChange={(v) =>
                    form.setValue(
                      "siteFavicon",
                      typeof v === "string" ? v : null,
                    )
                  }
                  placeholder="Select favicon"
                />
              </Field>
            </FieldGroup>
            <FieldGroup className="grid sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="siteEmail">Email</FieldLabel>
                <Input
                  id="siteEmail"
                  type="email"
                  {...form.register("siteEmail")}
                  placeholder="contact@example.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sitePhone">Phone</FieldLabel>
                <Input
                  id="sitePhone"
                  {...form.register("sitePhone")}
                  placeholder="+880 ..."
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="siteAddress">Address</FieldLabel>
                <Input
                  id="siteAddress"
                  {...form.register("siteAddress")}
                  placeholder="Street, city, country"
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="siteUrl">Site URL</FieldLabel>
                <Input
                  id="siteUrl"
                  {...form.register("siteUrl")}
                  placeholder="https://example.com"
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Social links</FieldLegend>
            <FieldDescription>
              Optional links to your social profiles. Leave URL empty to hide.
            </FieldDescription>
            <FieldGroup className="space-y-3">
              {SOCIAL_KEYS.map(({ key, label }) => {
                return (
                  <div
                    key={key}
                    className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                  >
                    <Field>
                      <FieldLabel className="text-muted-foreground text-xs">
                        {label}
                      </FieldLabel>
                      <Input
                        placeholder="Label"
                        {...form.register(`socials.${key}.name` as const)}
                      />
                    </Field>
                    <Field>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...form.register(`socials.${key}.url` as const)}
                      />
                    </Field>
                  </div>
                );
              })}
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>SEO Settings</FieldLegend>
            <FieldDescription>
              Configure search engine optimization and social media sharing
              metadata.
            </FieldDescription>
            <FieldGroup className="space-y-4">
              <FieldGroup className="grid sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="seo.metaTitle">Meta Title</FieldLabel>
                  <Input
                    id="seo.metaTitle"
                    {...form.register("seo.metaTitle")}
                    placeholder="Page title for search engines"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seo.canonicalUrl">
                    Canonical URL
                  </FieldLabel>
                  <Input
                    id="seo.canonicalUrl"
                    type="url"
                    {...form.register("seo.canonicalUrl")}
                    placeholder="https://example.com/page"
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="seo.metaDescription">
                    Meta Description
                  </FieldLabel>
                  <Textarea
                    id="seo.metaDescription"
                    {...form.register("seo.metaDescription")}
                    placeholder="Brief description for search results"
                    rows={2}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="seo.metaKeywords">
                    Meta Keywords
                  </FieldLabel>
                  <Input
                    id="seo.metaKeywords"
                    {...form.register("seo.metaKeywords")}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </Field>
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="seo.noindex"
                      checked={form.watch("seo.noindex") ?? false}
                      onCheckedChange={(checked) =>
                        form.setValue("seo.noindex", !!checked)
                      }
                    />
                    <FieldLabel htmlFor="seo.noindex" className="mb-0!">
                      No Index
                    </FieldLabel>
                  </div>
                  <FieldDescription>
                    Prevent search engines from indexing this page
                  </FieldDescription>
                </Field>
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="seo.nofollow"
                      checked={form.watch("seo.nofollow") ?? false}
                      onCheckedChange={(checked) =>
                        form.setValue("seo.nofollow", !!checked)
                      }
                    />
                    <FieldLabel htmlFor="seo.nofollow" className="mb-0!">
                      No Follow
                    </FieldLabel>
                  </div>
                  <FieldDescription>
                    Prevent search engines from following links on this page
                  </FieldDescription>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <FieldLegend className="text-base">
                  Open Graph (Facebook)
                </FieldLegend>
                <FieldGroup className="grid sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="seo.ogTitle">OG Title</FieldLabel>
                    <Input
                      id="seo.ogTitle"
                      {...form.register("seo.ogTitle")}
                      placeholder="Title for social media shares"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="seo.ogType">OG Type</FieldLabel>
                    <Input
                      id="seo.ogType"
                      {...form.register("seo.ogType")}
                      placeholder="website, article, etc."
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="seo.ogDescription">
                      OG Description
                    </FieldLabel>
                    <Textarea
                      id="seo.ogDescription"
                      {...form.register("seo.ogDescription")}
                      placeholder="Description for social media shares"
                      rows={2}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>OG Image</FieldLabel>
                    {config?.seo?.ogImage && (
                      <div className="relative mb-2">
                        <Image
                          src={(config.seo.ogImage as any)?.path || ""}
                          alt="OG Image"
                          className="rounded-md border object-cover relative! max-w-80!"
                          fill
                        />
                      </div>
                    )}
                    <AssetSelectorField
                      value={form.watch("seo.ogImage") || null}
                      onChange={(v) =>
                        form.setValue(
                          "seo.ogImage",
                          typeof v === "string" ? v : null,
                        )
                      }
                      placeholder="Select OG image"
                    />
                  </Field>
                </FieldGroup>
              </FieldGroup>

              <FieldGroup>
                <FieldLegend className="text-base">Twitter Card</FieldLegend>
                <FieldGroup className="grid sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="seo.twitterCard">
                      Twitter Card Type
                    </FieldLabel>
                    <Select
                      value={form.watch("seo.twitterCard") ?? ""}
                      onValueChange={(v) =>
                        form.setValue(
                          "seo.twitterCard",
                          v ? (v as TwitterCard) : undefined,
                        )
                      }
                    >
                      <SelectTrigger id="seo.twitterCard">
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TwitterCard).map((card) => (
                          <SelectItem key={card} value={card}>
                            {card
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="seo.twitterTitle">
                      Twitter Title
                    </FieldLabel>
                    <Input
                      id="seo.twitterTitle"
                      {...form.register("seo.twitterTitle")}
                      placeholder="Title for Twitter shares"
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="seo.twitterDescription">
                      Twitter Description
                    </FieldLabel>
                    <Textarea
                      id="seo.twitterDescription"
                      {...form.register("seo.twitterDescription")}
                      placeholder="Description for Twitter shares"
                      rows={2}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Twitter Image</FieldLabel>
                    {config?.seo?.twitterImage && (
                      <div className="relative mb-2">
                        <Image
                          src={(config.seo.twitterImage as any)?.path || ""}
                          alt="Twitter Image"
                          className="rounded-md border object-cover relative! max-w-80!"
                          fill
                        />
                      </div>
                    )}
                    <AssetSelectorField
                      value={form.watch("seo.twitterImage") || null}
                      onChange={(v) =>
                        form.setValue(
                          "seo.twitterImage",
                          typeof v === "string" ? v : null,
                        )
                      }
                      placeholder="Select Twitter image"
                    />
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </FieldGroup>
          </FieldSet>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner className="size-4" />}
              Save changes
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
