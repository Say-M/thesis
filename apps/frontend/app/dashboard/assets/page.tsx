"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useListAssetsInfinite,
  useCreateAsset,
  useCreateBulkAssets,
  useDeleteAsset,
  type AssetListItem,
} from "@/hooks/api/assets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AssetCard, formatFileSize } from "./asset-card";
import { UploadAssetDialog } from "./upload-asset-dialog";
import { AssetsEmptyState } from "./assets-empty-state";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useInView } from "react-intersection-observer";

const SEARCH_DEBOUNCE_MS = 300;

function formatAspectRatio(width: number, height: number): string {
  if (height <= 0) return "—";
  const ratio = width / height;
  return `${ratio.toFixed(2)}:1`;
}

function AssetPreviewDialogContent({
  asset,
  dimensions,
  onImageLoad,
}: {
  asset: AssetListItem;
  dimensions: { width: number; height: number } | null;
  onImageLoad: (width: number, height: number) => void;
}) {
  const isImage = asset.mimetype?.startsWith("image/");
  const aspectLabel =
    dimensions && dimensions.height > 0
      ? formatAspectRatio(dimensions.width, dimensions.height)
      : null;
  const dimensionsLabel =
    dimensions && dimensions.width > 0 && dimensions.height > 0
      ? `${dimensions.width}×${dimensions.height}`
      : null;

  return (
    <div className="space-y-3">
      <div className="relative flex justify-center rounded-lg border bg-muted/30 overflow-hidden min-h-[200px]">
        {isImage ? (
          <img
            src={asset.path}
            alt={asset.name}
            className="max-h-[70vh] w-auto object-contain"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight)
                onImageLoad(img.naturalWidth, img.naturalHeight);
            }}
          />
        ) : (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            Preview not available
          </div>
        )}
      </div>
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span title="File size">{formatFileSize(asset.size)}</span>
          <span title="Media type">{asset.mimetype ?? "—"}</span>
        </div>
        {(dimensionsLabel || aspectLabel) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground pt-1 border-t border-border/50">
            {dimensionsLabel && (
              <span title="Dimensions (width x height)">{dimensionsLabel}</span>
            )}
            {aspectLabel && <span title="Aspect ratio">{aspectLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
const DEFAULT_LIMIT = 24;

export default function AssetsPage() {
  const { ref, inView } = useInView({ threshold: 0.8 });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMultiple, setUploadMultiple] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<AssetListItem | null>(
    null,
  );
  const [selectedAsset, setSelectedAsset] = useState<AssetListItem | null>(
    null,
  );
  const [dimensionsById, setDimensionsById] = useState<
    Record<string, { width: number; height: number }>
  >({});
  /** Dimensions for the asset currently shown in preview dialog (from dialog image onLoad if not in grid) */
  const [previewDimensions, setPreviewDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, status, fetchNextPage, isFetchingNextPage } =
    useListAssetsInfinite({
      search: searchQuery || undefined,
      limit: DEFAULT_LIMIT,
    });

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

  const assets = useMemo(
    () => data?.pages?.map((p) => p?.assets).flat() ?? [],
    [data],
  );

  const { mutate: createAsset, isPending: isCreating } = useCreateAsset();
  const { mutate: createBulkAssets, isPending: isBulkCreating } =
    useCreateBulkAssets();
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();
  const isUploading = isCreating || isBulkCreating;

  const openUploadDialog = (multiple: boolean) => {
    setUploadMultiple(multiple);
    setUploadDialogOpen(true);
  };

  const handleUpload = (files: File[]) => {
    if (files.length === 0) return;
    if (uploadMultiple) {
      createBulkAssets(
        { files },
        { onSuccess: () => setUploadDialogOpen(false) },
      );
    } else {
      createAsset(
        { file: files[0]! },
        { onSuccess: () => setUploadDialogOpen(false) },
      );
    }
  };

  const handleConfirmDelete = () => {
    if (assetToDelete) {
      deleteAsset(assetToDelete._id, {
        onSettled: () => setAssetToDelete(null),
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            type="text"
            placeholder="Search by name"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search assets"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => openUploadDialog(false)}
            disabled={isUploading}
          >
            <Upload className="size-4" />
            Upload one
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => openUploadDialog(true)}
            disabled={isUploading}
          >
            <Upload className="size-4" />
            Upload multiple
          </Button>
        </div>
      </div>

      <UploadAssetDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        multiple={uploadMultiple}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      <AlertDialog
        open={assetToDelete !== null}
        onOpenChange={(open) => !open && setAssetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{assetToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner className="size-4 mr-2" />}
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={selectedAsset !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAsset(null);
            setPreviewDimensions(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8 truncate">
              {selectedAsset?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <AssetPreviewDialogContent
              asset={selectedAsset}
              dimensions={
                dimensionsById[selectedAsset._id] ?? previewDimensions ?? null
              }
              onImageLoad={(width, height) => {
                setPreviewDimensions({ width, height });
                setDimensionsById((prev) =>
                  prev[selectedAsset._id]
                    ? prev
                    : {
                        ...prev,
                        [selectedAsset._id]: { width, height },
                      },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {status === "pending" || isFetchingNextPage ? (
        <div className="flex items-center justify-center min-h-[280px]">
          <Spinner />
        </div>
      ) : !assets.length ? (
        <AssetsEmptyState
          openUploadDialog={openUploadDialog}
          isUploading={isUploading}
        />
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 px-0">
            {assets.map((asset) => (
              <AssetCard
                key={asset._id}
                asset={asset}
                dimensions={dimensionsById[asset._id]}
                onImageLoad={(assetId, width, height) => {
                  setDimensionsById((prev) =>
                    prev[assetId]
                      ? prev
                      : { ...prev, [assetId]: { width, height } },
                  );
                }}
                onDeleteClick={(asset) => setAssetToDelete(asset)}
                onPreviewClick={(asset) => setSelectedAsset(asset)}
                isDeleting={isDeleting}
              />
            ))}
          </div>
          <div ref={ref} />
        </>
      )}
    </div>
  );
}
