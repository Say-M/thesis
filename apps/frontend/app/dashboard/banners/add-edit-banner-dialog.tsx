"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { AssetSelectorField } from "@/components/ui/asset-selector";
import {
  createBannerSchema,
  CreateBannerSchemaType,
  updateBannerSchema,
} from "@repo/common/schemas/banner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { useCreateBanner, useUpdateBanner } from "@/hooks/api/banners";
import type { BannerListItem } from "@/hooks/api/banners";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type BannerFormValues = Omit<CreateBannerSchemaType, "status"> & {
  status: boolean;
};

const defaultValues: BannerFormValues = {
  title: "",
  description: "",
  image: "",
  link: "",
  serial: 1,
  status: true,
};

export default function AddEditBannerDialog({
  open,
  onOpenChange,
  banner,
  button,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: BannerListItem | null;
  button: React.ReactNode;
}) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(
      banner ? updateBannerSchema : createBannerSchema,
    ) as Resolver<BannerFormValues>,
    defaultValues,
  });

  const { mutate: createBanner, isPending: isCreating } = useCreateBanner();
  const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner();
  const isPending = isCreating || isUpdating;

  // Sync form values when opening for create/edit
  useEffect(() => {
    if (!open) return;
    if (banner) {
      form.reset({
        title: banner.title ?? "",
        description: banner.description ?? "",
        image: banner.image?._id ?? "",
        link: banner.link ?? "",
        serial: banner.serial ?? 1,
        status: banner.status ?? true,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, banner, form]);

  const onSubmit = (values: BannerFormValues) => {
    if (banner) {
      updateBanner(
        {
          id: banner._id,
          payload: values,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset(defaultValues);
          },
        },
      );
    } else {
      createBanner(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(defaultValues);
        },
      });
    }
  };

  return (
    <>
      {button}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{banner ? "Edit" : "Add"} Banner</DialogTitle>
              <DialogDescription>
                {banner ? "Edit" : "Add"} a homepage banner.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100svh-20rem)] -mx-4 px-4 overflow-y-auto">
              <FieldGroup className="mt-6">
                <FieldSet>
                  <FieldGroup>
                    <Controller
                      name="title"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="title">Title</FieldLabel>
                          <Input
                            {...field}
                            id="title"
                            placeholder="Title"
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
                      render={({ field: { value, ...field }, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="description">
                            Description (optional)
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id="description"
                            value={value ?? ""}
                            placeholder="Short description"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <div className="space-y-2">
                      <AssetSelectorField
                        label="Image"
                        description="Select from library or upload a new image. Recommended ratio is 16:9."
                        value={form.watch("image") ?? null}
                        onChange={(v) =>
                          form.setValue("image", typeof v === "string" ? v : "")
                        }
                        multiple={false}
                      />
                      {form.formState.errors.image && (
                        <FieldError errors={[form.formState.errors.image]} />
                      )}
                    </div>
                    <Controller
                      name="link"
                      control={form.control}
                      render={({ field: { value, ...field }, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="link">
                            Link (optional)
                          </FieldLabel>
                          <Input
                            {...field}
                            value={value ?? undefined}
                            type="url"
                            placeholder="https://…"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="serial"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="serial">Serial</FieldLabel>
                          <Input
                            {...field}
                            id="serial"
                            type="number"
                            min={1}
                            value={field.value ?? 1}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : 1,
                              )
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
              </FieldGroup>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner />}
                {banner ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
