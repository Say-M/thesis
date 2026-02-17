"use client";

import { AssetSelectorField } from "@/components/ui/asset-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { ComboboxApiSearch } from "@/components/ui/combobox-api-search";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCategorySearch } from "@/hooks/use-category-search";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCategory, useUpdateCategory } from "@/hooks/api/categories";
import type { CategoryDetail } from "@/hooks/api/categories";
import {
  createCategorySchema,
  CreateCategorySchemaType,
  updateCategorySchema,
} from "@repo/common/schemas/category";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Trash2 } from "lucide-react";

type CreateCategoryFormValues = Omit<
  CreateCategorySchemaType,
  "status" | "featured"
> & {
  status: boolean;
  featured: boolean;
  isDeleteThumbnail?: boolean;
};

const defaultValues: CreateCategoryFormValues = {
  name: "",
  status: true,
  featured: false,
  description: undefined,
  parentCategory: undefined,
  thumbnail: undefined,
  isDeleteThumbnail: false,
};

export default function AddEditCategoryDialog({
  open,
  onOpenChange,
  category,
  button,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDetail | null;
  button: React.ReactNode;
}) {
  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(
      category ? updateCategorySchema : createCategorySchema,
    ) as Resolver<CreateCategoryFormValues>,
    defaultValues,
  });

  const searchCategories = useCategorySearch({
    type: "parent",
    limit: 10,
    excludeId: category?._id,
  });
  const { mutate: createCategoryMutation, isPending: isCreating } =
    useCreateCategory();
  const { mutate: updateCategoryMutation, isPending: isUpdating } =
    useUpdateCategory();
  const isPending = isCreating || isUpdating;

  console.log(form.formState.errors);

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name ?? "",
          description: category.description ?? undefined,
          parentCategory: category.parentCategory?._id ?? undefined,
          status: category.status ?? true,
          featured: category.featured ?? false,
          thumbnail: undefined,
          isDeleteThumbnail: false,
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, category, form]);

  function onSubmit(data: CreateCategoryFormValues) {
    console.log({ data });
    if (category) {
      updateCategoryMutation(
        { id: category._id, payload: data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset(defaultValues);
          },
        },
      );
    } else {
      createCategoryMutation(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(defaultValues);
        },
      });
    }
  }

  return (
    <>
      {button}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{category ? "Edit" : "Add"} Category</DialogTitle>
              <DialogDescription>
                {category ? "Edit" : "Add"} a new category to your collection.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100svh-20rem)] -mx-4 px-4 overflow-y-auto">
              <FieldGroup className="my-6">
                <FieldSet>
                  <FieldGroup>
                    <Controller
                      name="name"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="name">Name</FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            type="text"
                            aria-invalid={fieldState.invalid}
                            placeholder="Name"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="parentCategory"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="parentCategory">
                            Parent Category
                          </FieldLabel>
                          <ComboboxApiSearch<{
                            _id: string;
                            name: string;
                            label: string;
                            value: string;
                          }>
                            searchFn={searchCategories}
                            getOptionLabel={(opt) => opt.name}
                            getOptionValue={(opt) => opt._id}
                            value={field.value ?? null}
                            onChange={(option) =>
                              field.onChange(option ? option._id : "")
                            }
                            placeholder="Search parent category…"
                            debounceMs={300}
                            minQueryLength={0}
                            clearable
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
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
                            id={field.name}
                            value={value ?? ""}
                            aria-invalid={fieldState.invalid}
                            placeholder="Description"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    {category?.thumbnail?.path &&
                      !form.watch("isDeleteThumbnail") && (
                        <Field>
                          <FieldLabel>Current thumbnail</FieldLabel>
                          <div className="relative">
                            <Image
                              src={category.thumbnail.path}
                              alt={category.thumbnail.name || "Thumbnail"}
                              className="rounded-md border object-cover relative!"
                              fill
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              className="absolute top-2 right-2"
                              onClick={() =>
                                form.setValue("isDeleteThumbnail", true)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </Field>
                      )}
                    {form.watch("isDeleteThumbnail") && category?.thumbnail && (
                      <FieldDescription>
                        Thumbnail will be removed on save.
                      </FieldDescription>
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
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <FieldLabel>
                          <Field orientation="horizontal">
                            <FieldContent>
                              Status
                              <FieldDescription>
                                Active categories will be displayed in the menu.
                              </FieldDescription>
                            </FieldContent>
                            <Switch
                              id={field.name}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-invalid={fieldState.invalid}
                            />
                          </Field>
                        </FieldLabel>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="featured"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <FieldLabel
                          htmlFor={field.name}
                          className="font-normal"
                        >
                          <Field orientation="horizontal">
                            <FieldContent>
                              Featured
                              <FieldDescription>
                                Featured categories will be displayed on the
                                home page.
                              </FieldDescription>
                            </FieldContent>
                            <Switch
                              id={field.name}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-invalid={fieldState.invalid}
                            />
                          </Field>
                        </FieldLabel>
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
                {category ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
