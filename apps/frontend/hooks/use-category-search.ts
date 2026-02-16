import { useCallback } from "react";
import useApi from "./use-api";

export type CategorySearchOption = {
  _id: string;
  name: string;
  label: string;
  value: string;
  parentCategory?: { _id: string };
};

export type UseCategorySearchOptions = {
  /** "parent" for top-level categories, "child" for subcategories */
  type: "parent" | "child";
  limit?: number;
  /** Exclude this category id from results (e.g. when editing self) */
  excludeId?: string | null;
  /** When type is "child", filter results to this parent category id */
  parentId?: string | null;
};

/**
 * Returns a search function for use with ComboboxApiSearch to fetch categories.
 * Use for parent category, subcategory, or any category list with filters.
 */
export function useCategorySearch(options: UseCategorySearchOptions) {
  const api = useApi();
  const { type, limit = 20, excludeId, parentId } = options;

  const searchFn = useCallback(
    async (query: string): Promise<CategorySearchOption[]> => {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", String(limit));
      params.set("status", "true");
      params.set("type", type);
      if (parentId) params.set("parentCategories", parentId);
      const { data } = await api.get(`/categories?${params.toString()}`);
      const list = (data?.data?.categories ?? []) as {
        _id: string;
        name: string;
        parentCategory?: { _id: string };
      }[];
      let filtered = list;
      if (type === "child" && parentId) {
        filtered = list.filter((c) => c.parentCategory?._id === parentId);
      }
      if (excludeId) {
        filtered = filtered.filter((c) => c._id !== excludeId);
      }
      return filtered.map((c) => ({ ...c, label: c.name, value: c._id }));
    },
    [api, type, limit, excludeId, parentId],
  );

  return searchFn;
}
