"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { pageSchema, type PageSchemaType } from "@repo/common/schemas/page";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useGetPage, useCreatePage, useUpdatePage } from "@/hooks/api/pages";
import { Search } from "lucide-react";
import PlateEditor from "@/components/plugins/editor";

const defaultValues: PageSchemaType = {
  title: "",
  slug: "",
  tag: "",
  content: null as PageSchemaType["content"],
  seo: null,
  status: true,
  showInHeader: false,
  showInFooter: false,
  order: 0,
};

function pageToFormValues(page: {
  title: string;
  slug: string;
  tag: string;
  content?: unknown;
  status: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  order: number;
}): Partial<PageSchemaType> {
  return {
    title: page.title ?? "",
    slug: page.slug ?? "",
    tag: page.tag ?? "",
    content: page.content ?? null,
    seo: null,
    status: page.status ?? true,
    showInHeader: page.showInHeader ?? false,
    showInFooter: page.showInFooter ?? false,
    order: page.order ?? 0,
  };
}

export default function AddEditPage({ id }: { id: string }) {
  const isCreate = id === "create";
  const router = useRouter();

  const {
    data: pageData,
    isLoading: loadingPage,
    error: pageError,
  } = useGetPage(isCreate ? null : id);
  const page = pageData?.data?.page;

  const form = useForm<PageSchemaType>({
    //@ts-ignore
    resolver: zodResolver(pageSchema),
    defaultValues,
  });

  const { mutate: createPage, isPending: isCreating } = useCreatePage();
  const { mutate: updatePage, isPending: isUpdating } = useUpdatePage();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!isCreate && page) {
      form.reset({
        ...defaultValues,
        ...pageToFormValues(page),
      });
    } else if (isCreate) {
      form.reset(defaultValues);
    }
  }, [isCreate, page, form]);

  const titleValue = form.watch("title");
  useEffect(() => {
    if (isCreate && titleValue?.trim()) {
      const slug = titleValue
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      if (slug) form.setValue("slug", slug);
    }
  }, [isCreate, titleValue, form]);

  const onSubmit = (values: Partial<PageSchemaType>) => {
    if (isCreate) {
      createPage(values as PageSchemaType, {
        onSuccess: (data) => {
          const newId = data?.data?.page?._id;
          if (newId) router.push(`/dashboard/pages/${newId}`);
        },
      });
    } else {
      updatePage(
        {
          id,
          payload: values as PageSchemaType,
        },
        { onSuccess: () => form.reset(form.getValues()) },
      );
    }
  };

  if (!isCreate && loadingPage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isCreate && pageError) {
    return (
      <div className="p-4">
        <p className="text-destructive">Page not found.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/dashboard/pages">Back to pages</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {isCreate ? "Create Page" : "Edit Page"}
        </h1>
        {!isCreate && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/seo/${id}?type=page`}>
              <Search className="mr-2 size-4" />
              {page?.seo ? "Edit SEO" : "Add SEO"}
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Basic information</FieldLegend>
            <FieldDescription>
              Title and slug are required. Slug is used in the URL (e.g.{" "}
              <span className="font-mono text-foreground">/pages/about-us</span>
              ).
            </FieldDescription>
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
                      placeholder="Page title"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Controller
                name="tag"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="tag">Tag</FieldLabel>
                    <Input
                      {...field}
                      id="tag"
                      placeholder="Page tag"
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
                      placeholder="about-us"
                      className="font-mono"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="mt-4">
                  <FieldLabel htmlFor="content">Content</FieldLabel>
                  <div>
                    <PlateEditor
                      onChange={field.onChange}
                      value={page?.content}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {/* <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => {
                const content = field.value;
                const hasContent =
                  content != null &&
                  (typeof content !== "object" ||
                    Object.keys(content as object).length > 0);
                const initialState = getContentInitialState(
                  content,
                  isCreate,
                  page?.content,
                );
                return (
                  <Field data-invalid={fieldState.invalid} className="mt-4">
                    <FieldLabel htmlFor="content">Content</FieldLabel>
                    <Editor
                      key={`content-editor-${id}-${isCreate ? "create" : hasContent ? "loaded" : "empty"}`}
                      onSerializedChange={(state) => field.onChange(state)}
                      editorSerializedState={initialState}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            /> */}
            <FieldGroup className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="order"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="order">Order</FieldLabel>
                    <Input
                      {...field}
                      id="order"
                      type="number"
                      min={0}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : 0,
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
            </FieldGroup>
            <FieldGroup className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="status"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="status" className="font-normal">
                      Active
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="showInHeader"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="showInHeader"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="showInHeader" className="font-normal">
                      Show in header
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="showInFooter"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="showInFooter"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="showInFooter" className="font-normal">
                      Show in footer
                    </FieldLabel>
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
              {isCreate ? "Create Page" : "Update Page"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
