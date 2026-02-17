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
import { useConfigContext } from "@/contexts/config";
import { useUpdateConfig, type ConfigData } from "@/hooks/api/config";
import { AssetSelectorField } from "@/components/ui/asset-selector";
import {
  updateConfigSchema,
  type UpdateConfigSchemaType,
} from "@repo/common/schemas/config";
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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Spinner className="size-4" /> : "Save changes"}
          </Button>
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
              <Field>
                <FieldLabel htmlFor="taxAmount">Default tax amount</FieldLabel>
                <Input
                  id="taxAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  {...form.register("taxAmount", { valueAsNumber: true })}
                />
              </Field>
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
        </FieldGroup>
      </form>
    </div>
  );
}
