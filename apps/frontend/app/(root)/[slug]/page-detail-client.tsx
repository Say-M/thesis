import Image from "next/image";
import type { PageDetail } from "@/hooks/api/pages";
import { Editor } from "@/components/blocks/editor-00/editor";
import type { SerializedEditorState } from "lexical";

type PageDetailClientProps = {
  slug: string;
  page: PageDetail | null;
};

export function PageDetailClient({ slug, page }: PageDetailClientProps) {
  if (!page) {
    return (
      <div className="mx-auto max-w-4xl px-4 my-12 text-center md:px-8">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or is no longer
          available.
        </p>
      </div>
    );
  }

  const featuredImage =
    page.featuredImage &&
    typeof page.featuredImage === "object" &&
    "path" in page.featuredImage
      ? page?.featuredImage?.path
      : undefined;
  const content = page?.content as SerializedEditorState | null | undefined;

  return (
    <article className="mx-auto max-w-4xl px-4 my-8 md:px-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {page?.title ?? ""}
        </h1>
        {featuredImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={featuredImage}
              alt={page?.title ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          </div>
        )}
      </header>

      <div className="mt-8">
        {content ? (
          <Editor
            editorSerializedState={content}
            readOnly
            showToolbar={false}
            minHeight="min-h-0"
            className="border-0 shadow-none -m-4"
          />
        ) : (
          <p className="text-muted-foreground">No content.</p>
        )}
      </div>
    </article>
  );
}
