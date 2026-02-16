"use client";

import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X, Image as ImageIcon } from "lucide-react";
import type { AssetListItem } from "@/hooks/api/assets";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

function isImage(mimetype: string): boolean {
  return mimetype?.startsWith("image/") ?? false;
}

export interface AssetCardProps {
  asset: AssetListItem;
  onDeleteClick: (asset: AssetListItem) => void;
  onPreviewClick?: (asset: AssetListItem) => void;
  onImageLoad?: (assetId: string, width: number, height: number) => void;
  isDeleting?: boolean;
  /** When set, image uses this aspect ratio (masonry style); otherwise square */
  dimensions?: { width: number; height: number } | null;
}

export function AssetCard({
  asset,
  onDeleteClick,
  onPreviewClick,
  onImageLoad,
  isDeleting,
  dimensions,
}: AssetCardProps) {
  const isImg = isImage(asset.mimetype);
  const aspectRatio =
    dimensions && dimensions.height > 0
      ? dimensions.width / dimensions.height
      : 1;
  const dimensionsLabel =
    dimensions && dimensions.width > 0 && dimensions.height > 0
      ? `${dimensions.width}×${dimensions.height}`
      : null;
  const aspectLabel =
    dimensions && dimensions.height > 0
      ? `${(dimensions.width / dimensions.height).toFixed(2)}:1`
      : null;

  return (
    <div
      className="group relative rounded-lg border bg-card overflow-hidden cursor-pointer break-inside-avoid mb-4 w-full"
      role={onPreviewClick ? "button" : undefined}
      tabIndex={onPreviewClick ? 0 : undefined}
      onClick={() => onPreviewClick?.(asset)}
      onKeyDown={(e) => {
        if (onPreviewClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPreviewClick(asset);
        }
      }}
    >
      <AspectRatio ratio={aspectRatio} className="bg-muted relative">
        {isImg ? (
          <img
            src={asset.path}
            alt={asset.name}
            className="w-full h-full object-cover"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight)
                onImageLoad?.(asset._id, img.naturalWidth, img.naturalHeight);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground" />
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(asset);
          }}
          disabled={isDeleting}
          aria-label="Delete asset"
        >
          <X className="size-4" />
        </Button>
      </AspectRatio>
      <div className="p-2 min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium" title={asset.name}>
          {asset.name}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {formatFileSize(asset.size)}
          </p>
          {(dimensionsLabel || aspectLabel) && (
            <p className="text-xs text-muted-foreground">
              {[dimensionsLabel, aspectLabel].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
