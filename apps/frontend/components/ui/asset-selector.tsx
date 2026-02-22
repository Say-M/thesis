"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useListAssetsInfinite,
  useCreateBulkAssets,
  useCreateAsset,
} from "@/hooks/api/assets";
import { Image as ImageIcon, Check, Upload } from "lucide-react";
import { cn, isImage, formatBytes } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";
import Image from "next/image";
import { AspectRatio } from "./aspect-ratio";
import { useInView } from "react-intersection-observer";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 24;

export interface AssetSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current selected asset id(s) */
  value: string | string[] | null;
  /** Called when user confirms selection */
  onChange: (id: string | null | string[]) => void;
  /** Single asset (e.g. thumbnail) or multiple (e.g. gallery) */
  multiple?: boolean;
  /** Max number of assets when multiple (default 10) */
  maxSelection?: number;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
}

export function AssetSelectDialog({
  open,
  onOpenChange,
  value,
  onChange,
  multiple = false,
  maxSelection = 10,
  title = "Select from library",
  description = "Choose an asset from your media library.",
}: AssetSelectDialogProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [dimensionsById, setDimensionsById] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createBulkAssets, isPending: isBulkUploading } =
    useCreateBulkAssets();

  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  // Sync pending selection from value when dialog opens
  useEffect(() => {
    if (open) {
      if (multiple && Array.isArray(value)) {
        setPendingIds(new Set(value));
      } else if (!multiple && value && typeof value === "string") {
        setPendingIds(new Set([value]));
      } else {
        setPendingIds(new Set());
      }
    }
  }, [open, value, multiple]);

  const { data, status, fetchNextPage, isFetchingNextPage } =
    useListAssetsInfinite({
      search: searchQuery || undefined,
      limit: PAGE_SIZE,
    });
  const assets = useMemo(
    () => data?.pages?.map((p) => p?.assets).flat() ?? [],
    [data],
  );

  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

  const isLoading = status === "pending" || isFetchingNextPage;

  const toggle = (assetId: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        if (multiple) {
          if (next.size >= maxSelection) return prev;
          next.add(assetId);
        } else {
          return new Set([assetId]);
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (multiple) {
      onChange(Array.from(pendingIds));
    } else {
      const single = pendingIds.size ? Array.from(pendingIds)[0]! : null;
      onChange(single);
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    setPendingIds(new Set());
    onChange(multiple ? [] : null);
    onOpenChange(false);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    if (fileList.length) {
      createBulkAssets(
        { files: fileList },
        {
          onSuccess: (res) => {
            const created = (res as { data?: { assets?: { _id: string }[] } })
              ?.data?.assets;
            if (created?.length) {
              const ids = created.map((a) => a._id.toString());
              setPendingIds((prev) => {
                const next = new Set(prev);
                for (const id of ids) {
                  if (!multiple) {
                    return new Set([id]);
                  }
                  if (next.size >= maxSelection) break;
                  next.add(id);
                }
                return next;
              });
            }
          },
        },
      );
    }
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl!">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search by name..."
            className="flex-1 min-w-[140px]"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search assets"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBulkUploading}
          >
            {isBulkUploading ? (
              <Spinner className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBulkUpload}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20">
          {!assets.length ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground text-sm p-4 text-center">
              <ImageIcon className="size-10 mb-2 opacity-50" />
              <p>No assets found. Search or upload images above.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="columns-1 xs:columns-2 sm:columns-3 gap-2 p-2">
                {assets?.map((asset) => {
                  const selected = pendingIds.has(asset._id);
                  const dims = dimensionsById?.[asset._id];
                  const aspect =
                    dims && dims.height > 0
                      ? `${dims.width}×${dims.height} • ${(
                          dims.width / dims.height
                        ).toFixed(2)}:1`
                      : null;
                  return (
                    <AspectRatio
                      ratio={dims?.width / dims?.height}
                      key={asset._id}
                      onClick={() => toggle(asset._id)}
                      className={cn(
                        "relative mb-2 w-full rounded-lg border-2 overflow-hidden transition-colors break-inside-avoid",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground/30",
                      )}
                    >
                      {isImage(asset.mimetype) ? (
                        <Image
                          src={asset.path}
                          alt={asset.name}
                          className="object-cover"
                          fill
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            if (!img.naturalWidth || !img.naturalHeight) return;
                            setDimensionsById((prev) => {
                              if (prev[asset._id]) return prev;
                              return {
                                ...prev,
                                [asset._id]: {
                                  width: img.naturalWidth,
                                  height: img.naturalHeight,
                                },
                              };
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-muted">
                          <ImageIcon className="size-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/70 via-foreground/40 to-transparent text-sm text-background pt-3 p-1.5 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="truncate max-w-[70%]"
                            title={asset.name}
                          >
                            {asset.name}
                          </span>
                          <span className="shrink-0 opacity-80">
                            {formatBytes(asset.size)}
                          </span>
                        </div>
                        {aspect && (
                          <div className="flex items-center justify-between text-xs opacity-80">
                            <span>{aspect}</span>
                          </div>
                        )}
                      </div>

                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="size-6 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </AspectRatio>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          <div ref={ref} />
          {isLoading && (
            <div className="flex items-center justify-center min-h-[200px]">
              <Spinner />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Select ({multiple ? pendingIds.size : pendingIds.size ? 1 : 0})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface AssetSelectorFieldProps {
  /** Current value: single id or array of ids */
  value: string | string[] | null;
  onChange: (value: string | null | string[]) => void;
  multiple?: boolean;
  maxSelection?: number;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Optional: show preview of selected asset(s) - pass resolved assets for thumbnails */
  selectedAssets?: { _id: string; path: string; name?: string }[];
  error?: string;
}

export function AssetSelectorField({
  value,
  onChange,
  multiple = false,
  maxSelection = 10,
  label,
  description,
  placeholder = "Select from library",
  disabled,
  selectedAssets,
  error,
}: AssetSelectorFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const count = Array.isArray(value) ? value.length : value ? 1 : 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {selectedAssets && selectedAssets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedAssets.map((a) => (
              <div key={a._id} className="relative">
                <img
                  src={a.path}
                  alt={a.name ?? ""}
                  className="size-14 rounded-md border object-cover"
                />
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={disabled}
        >
          {count > 0 ? `${count} selected` : placeholder}
        </Button>
      </div>
      <AssetSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={value}
        onChange={onChange}
        multiple={multiple}
        maxSelection={maxSelection}
        title={label ?? "Select from library"}
        description={description ?? "Choose an asset from your media library."}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
