"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { ImagePlay } from "lucide-react";

export function AssetsEmptyState({
  openUploadDialog,
  isUploading,
}: {
  openUploadDialog: (multiple: boolean) => void;
  isUploading: boolean;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImagePlay />
        </EmptyMedia>
        <EmptyTitle>No Assets Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t uploaded any assets yet. Get started by uploading
          your first asset.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={() => openUploadDialog(false)} disabled={isUploading}>
          Upload Asset
        </Button>
        <Button onClick={() => openUploadDialog(true)} disabled={isUploading}>
          Upload Multiple Assets
        </Button>
      </EmptyContent>
    </Empty>
  );
}
