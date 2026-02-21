import type { PageDetail } from "@/hooks/api/pages";
import PlateEditor from "@/components/plugins/editor";
import type { Value } from "platejs";

type PageDetailClientProps = {
  slug: string;
  page: PageDetail | null;
};

export function PageDetailClient({ page }: PageDetailClientProps) {
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

  return (
    <article className="mx-auto max-w-4xl px-4 my-8 md:px-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {page.title}
        </h1>
      </header>

      <div className="mt-8">
        {page.content ? (
          <PlateEditor value={page.content} readOnly />
        ) : (
          <p className="text-muted-foreground">No content.</p>
        )}
      </div>
    </article>
  );
}
