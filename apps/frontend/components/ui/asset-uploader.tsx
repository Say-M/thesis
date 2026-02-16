"use client";

import * as React from "react";
import { Upload, X, File, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import { Field, FieldLabel } from "./field";

export interface AssetFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export interface AssetUploaderProps {
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  accept?: string; // e.g., "image/*", ".pdf,.doc"
  onUpload?: (files: File[]) => void | Promise<void>;
  onRemove?: (fileId: string) => void;
  className?: string;
  disabled?: boolean;
  // React Hook Form integration
  name?: string;
  value?: File | File[];
  onChange?: (files: File | File[] | null) => void;
  onBlur?: () => void;
  error?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) return Image;
  if (file.type.includes("pdf") || file.type.includes("document"))
    return FileText;
  return File;
};

export function AssetUploader({
  multiple = false,
  maxSize,
  maxFiles = 10,
  accept,
  onUpload,
  onRemove,
  className,
  disabled = false,
  name,
  value,
  onChange,
  onBlur,
  error,
}: AssetUploaderProps) {
  const [files, setFiles] = React.useState<AssetFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Sync with form value
  React.useEffect(() => {
    if (value !== undefined) {
      if (multiple) {
        const fileArray = Array.isArray(value) ? value : value ? [value] : [];
        setFiles((prevFiles) => {
          // Only update if files actually changed to avoid infinite loops
          const currentFileIds = prevFiles
            .map((f) => f.file.name + f.file.size)
            .join(",");
          const newFileIds = fileArray.map((f) => f.name + f.size).join(",");
          if (currentFileIds === newFileIds) {
            return prevFiles;
          }
          const assetFiles: AssetFile[] = fileArray.map((file) => ({
            id: `${file.name}-${file.size}`,
            file,
            progress: 100,
            status: "success" as const,
          }));
          // Create previews for images
          Promise.all(
            assetFiles.map(async (af) => {
              if (af.file.type.startsWith("image/")) {
                const preview = await createPreview(af.file);
                return { ...af, preview };
              }
              return af;
            }),
          ).then((previewedFiles) => setFiles(previewedFiles));
          return prevFiles; // Return current state while loading previews
        });
      } else {
        const singleFile = Array.isArray(value) ? value[0] : value;
        if (singleFile) {
          setFiles((prevFiles) => {
            const existingFile = prevFiles.find(
              (f) =>
                f.file.name === singleFile.name &&
                f.file.size === singleFile.size,
            );
            if (existingFile) {
              return prevFiles;
            }
            createPreview(singleFile).then((preview) => {
              setFiles([
                {
                  id: `${singleFile.name}-${singleFile.size}`,
                  file: singleFile,
                  preview,
                  progress: 100,
                  status: "success" as const,
                },
              ]);
            });
            return prevFiles; // Return current state while loading preview
          });
        } else {
          setFiles([]);
        }
      }
    }
  }, [value, multiple]);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds the limit of ${formatFileSize(maxSize)}`;
    }
    if (
      accept &&
      !accept.split(",").some((type) => {
        const trimmed = type.trim();
        if (trimmed.startsWith(".")) {
          return file.name.toLowerCase().endsWith(trimmed.toLowerCase());
        }
        if (trimmed.endsWith("/*")) {
          const baseType = trimmed.slice(0, -2);
          return file.type.startsWith(baseType);
        }
        return file.type === trimmed;
      })
    ) {
      return `File type not allowed. Accepted: ${accept}`;
    }
    return null;
  };

  const notifyChange = (newFiles: File[]) => {
    if (onChange) {
      if (multiple) {
        onChange(newFiles);
      } else {
        onChange(newFiles[0] || null);
      }
    }
    if (onBlur) {
      onBlur();
    }
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: File[] = Array.from(fileList);

    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: AssetFile[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const preview = await createPreview(file);
      const assetFile: AssetFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        progress: 0,
        status: "uploading",
      };
      validFiles.push(assetFile);
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);

      // Notify form of change
      const fileObjects = updatedFiles.map((f) => f.file);
      notifyChange(fileObjects);

      // Simulate upload progress
      validFiles.forEach((assetFile) => {
        simulateUpload(assetFile.id);
      });

      // Call onUpload callback
      if (onUpload) {
        await onUpload(validFiles.map((f) => f.file));
      }
    }
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: "success" as const }
              : f,
          ),
        );
        clearInterval(interval);
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );
      }
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await processFiles(droppedFiles);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (fileId: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      // Notify form of change
      const fileObjects = remaining.map((f) => f.file);
      notifyChange(fileObjects);
      return remaining;
    });
    if (onRemove) {
      onRemove(fileId);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed transition-colors rounded-md",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragging && "border-border hover:border-primary/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className={cn(
              "mb-4 rounded-full bg-muted p-4",
              isDragging && "bg-primary/10",
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8",
                isDragging ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div className="mb-2">
            <p className="text-sm font-medium">
              {isDragging
                ? "Drop files here"
                : "Drag and drop files here, or click to select"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {multiple
                ? `Up to ${maxFiles} files, max ${
                    maxSize ? formatFileSize(maxSize) : "no limit"
                  } each`
                : `Single file, max ${
                    maxSize ? formatFileSize(maxSize) : "no limit"
                  }`}
              {accept && ` • ${accept}`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
            className="mt-4"
          >
            <Upload className="size-4" />
            Select File{multiple ? "s" : ""}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept}
            onChange={handleFileInput}
            disabled={disabled}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((assetFile) => {
            const Icon = getFileIcon(assetFile.file);
            return (
              <div key={assetFile.id} className="p-4 border rounded-md">
                <div className="flex items-start gap-4">
                  {assetFile.preview ? (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border">
                      <img
                        src={assetFile.preview}
                        alt={assetFile.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium max-w-[250px] w-full">
                          {assetFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assetFile.file.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(assetFile.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="-mt-1 -mr-1"
                        onClick={() => handleRemove(assetFile.id)}
                      >
                        <X className="size-4!" />
                      </Button>
                    </div>
                    {assetFile.status === "uploading" && (
                      <div className="mt-2">
                        <Progress value={assetFile.progress} className="h-1" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {Math.round(assetFile.progress)}% uploaded
                        </p>
                      </div>
                    )}
                    {assetFile.error && (
                      <p className="mt-1 text-xs text-destructive">
                        {assetFile.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Wrapper component for use with react-hook-form Controller
export function AssetUploaderField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  ...props
}: Omit<AssetUploaderProps, "value" | "onChange" | "onBlur" | "error"> &
  Omit<ControllerProps<TFieldValues, TName>, "render"> & { label?: string }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
          <AssetUploader
            {...props}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        </Field>
      )}
    />
  );
}

// Hook-based wrapper for use with useFormContext
export function AssetUploaderFormField({
  name,
  ...props
}: Omit<AssetUploaderProps, "value" | "onChange" | "onBlur" | "error"> & {
  name: string;
}) {
  const form = useFormContext();
  const field = form.register(name);
  const fieldState = form.formState.errors[name];

  return (
    <AssetUploader
      {...props}
      name={name}
      value={form.watch(name)}
      onChange={(files) => form.setValue(name, files, { shouldValidate: true })}
      onBlur={field.onBlur as unknown as () => void}
      error={fieldState?.message as string | undefined}
    />
  );
}
