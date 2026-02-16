"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AssetUploader } from "@/components/ui/asset-uploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple: boolean;
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
}

export function UploadAssetDialog({
  open,
  onOpenChange,
  multiple,
  onUpload,
  isUploading = false,
}: UploadAssetDialogProps) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setPendingFiles([]);
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (pendingFiles.length === 0) return;
    onUpload(pendingFiles);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {multiple ? "Upload images" : "Upload image"}
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? "Select or drag multiple images. Max 5MB each, up to 10 files."
              : "Select or drag one image. Max 5MB."}
          </DialogDescription>
        </DialogHeader>
        <AssetUploader
          multiple={multiple}
          accept="image/*"
          maxSize={MAX_UPLOAD_SIZE}
          maxFiles={10}
          value={
            multiple ? pendingFiles : pendingFiles[0] ?? undefined
          }
          onChange={(v) =>
            setPendingFiles(v ? (Array.isArray(v) ? v : [v]) : [])
          }
          disabled={isUploading}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pendingFiles.length === 0 || isUploading}
          >
            {isUploading && <Spinner className="size-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
