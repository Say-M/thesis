"use client";

import * as React from "react";

import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";

import { PlaceholderPlugin } from "@platejs/media/react";
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LibraryIcon,
  LinkIcon,
  Upload,
} from "lucide-react";
import { isUrl, KEYS } from "platejs";
import { useEditorRef } from "platejs/react";
import { toast } from "sonner";
import { useFilePicker } from "use-file-picker";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from "./toolbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { useCreateBulkAssets, useListAssetsInfinite } from "@/hooks/api/assets";
import { useInView } from "react-intersection-observer";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { ScrollArea } from "./scroll-area";
import { AspectRatio } from "./aspect-ratio";
import { formatBytes, isImage } from "@/lib/utils";
import Image from "next/image";

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    title: string;
    tooltip: string;
  }
> = {
  [KEYS.audio]: {
    accept: ["audio/*"],
    icon: <AudioLinesIcon className="size-4" />,
    title: "Insert Audio",
    tooltip: "Audio",
  },
  [KEYS.file]: {
    accept: ["*"],
    icon: <FileUpIcon className="size-4" />,
    title: "Insert File",
    tooltip: "File",
  },
  [KEYS.img]: {
    accept: ["image/*"],
    icon: <ImageIcon className="size-4" />,
    title: "Insert Image",
    tooltip: "Image",
  },
  [KEYS.video]: {
    accept: ["video/*"],
    icon: <FilmIcon className="size-4" />,
    title: "Insert Video",
    tooltip: "Video",
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const currentConfig = MEDIA_CONFIG[nodeType];

  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [libraryOpen, setLibraryOpen] = React.useState(false);

  return (
    <>
      <ToolbarSplitButton
        onClick={() => {
          setLibraryOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setLibraryOpen(true);
          }
        }}
        pressed={libraryOpen}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          open={open}
          onOpenChange={setOpen}
          modal={false}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="start"
            alignOffset={-32}
          >
            <DropdownMenuGroup>
              {/* <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                Upload from computer
              </DropdownMenuItem> */}
              <DropdownMenuItem onSelect={() => setLibraryOpen(true)}>
                <LibraryIcon />
                Asset Library
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                Insert via URL
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <Dialog
        open={libraryOpen}
        onOpenChange={(value) => {
          setLibraryOpen(value);
        }}
      >
        <AssetLibraryDialogContent
          nodeType={nodeType}
          setOpen={setLibraryOpen}
        />
      </Dialog>
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 24;

function AssetLibraryDialogContent({
  nodeType,
  setOpen,
}: {
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dimensionsById, setDimensionsById] = React.useState<
    Record<string, { width: number; height: number }>
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { mutate: createBulkAssets, isPending: isBulkUploading } =
    useCreateBulkAssets();

  React.useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListAssetsInfinite({
      search: searchQuery || undefined,
      limit: PAGE_SIZE,
    });
  const assets = React.useMemo(
    () => data?.pages?.map((p) => p.assets).flat() ?? [],
    [data?.pages],
  );

  const { ref, inView } = useInView({ threshold: 0.8 });
  React.useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage]);

  const isLoading = status === "pending" || isFetchingNextPage;

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    if (fileList.length) {
      createBulkAssets({ files: fileList });
    }
    e.target.value = "";
  };

  const embedMedia = React.useCallback(
    (url: string) => {
      if (!isUrl(url)) return toast.error("Invalid URL");

      setOpen(false);
      editor.tf.insertNodes({
        children: [{ text: "" }],
        name: nodeType === KEYS.file ? url.split("/").pop() : undefined,
        type: nodeType,
        url,
      });
    },
    [editor, nodeType, setOpen],
  );

  return (
    <DialogContent className="sm:max-w-4xl!">
      <DialogHeader>
        <DialogTitle>Asset Library</DialogTitle>
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
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground text-sm p-4 text-center">
            <ImageIcon className="size-10 mb-2 opacity-50" />
            <p>No assets found. Search or upload images above.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="columns-1 xs:columns-2 sm:columns-3 gap-2 p-2">
              {assets?.map((asset) => {
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
                    onClick={() => embedMedia(asset.path)}
                    className="relative mb-2 w-full rounded-lg border-2 overflow-hidden transition-colors break-inside-avoid focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </DialogContent>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [url, setUrl] = React.useState("");

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error("Invalid URL");

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: "" }],
      name: nodeType === KEYS.file ? url.split("/").pop() : undefined,
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          Accept
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
