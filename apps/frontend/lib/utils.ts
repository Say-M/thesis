import { CategoryDetail } from "@/hooks/api/categories";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isImage(mimetype: string): boolean {
  return mimetype?.startsWith("image/") ?? false;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function groupCategoriesByParent(categories: CategoryDetail[]): Record<
  string,
  {
    parentCategory: { _id: string; name: string };
    subcategories: CategoryDetail[];
  }
> {
  const grouped: Record<
    string,
    {
      parentCategory: {
        _id: string;
        name: string;
      };
      subcategories: CategoryDetail[];
    }
  > = {};
  for (const category of categories) {
    if (!category.parentCategory?._id) continue;
    if (!grouped[category.parentCategory?._id])
      grouped[category.parentCategory?._id] = {
        parentCategory: {
          _id: category.parentCategory?._id,
          name: category.parentCategory?.name ?? "",
        },
        subcategories: [],
      };
    grouped[category.parentCategory?._id].subcategories.push(category);
  }
  return grouped;
}
