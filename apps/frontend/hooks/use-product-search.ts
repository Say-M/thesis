import { useCallback } from "react";
import useApi from "./use-api";
import { Asset } from "@app/backend/models/asset";

export type ProductSearchOption = {
  _id: string;
  name: string;
  label: string;
  value: string;
  thumbnail?: Omit<Asset, "_id"> & { _id: string };
  hasVariants?: boolean;
  discountType?: string;
  discountValue?: number;
  variants?: Array<{
    _id: string;
    sku?: string;
    options?: Array<{ name: string; value: string }>;
    sellingPrice: number;
    stock: number;
    discountType?: string;
    discountValue?: number;
  }>;
  sellingPrice?: number;
  stock?: number;
};

export type UseProductSearchOptions = {
  limit?: number;
  /** Exclude this product id from results */
  excludeId?: string | null;
};

/**
 * Returns a search function for use with ComboboxApiSearch to fetch products.
 */
export function useProductSearch(options: UseProductSearchOptions = {}) {
  const api = useApi();
  const { limit = 20, excludeId } = options;

  const searchFn = useCallback(
    async (query: string): Promise<ProductSearchOption[]> => {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", String(limit));
      params.set("status", "true");
      const { data } = await api.get(`/products?${params.toString()}`);
      const list = (data?.data?.products ?? []) as {
        _id: string;
        name: string;
        hasVariants?: boolean;
        variants?: Array<{
          _id: string;
          sku?: string;
          options?: Array<{ name: string; value: string }>;
          sellingPrice: number;
          stock: number;
        }>;
        sellingPrice?: number;
        stock?: number;
      }[];
      let filtered = list;
      if (excludeId) {
        filtered = filtered.filter((p) => p._id !== excludeId);
      }
      return filtered.map((p) => ({
        ...p,
        label: p.name,
        value: p._id,
      }));
    },
    [api, limit, excludeId],
  );

  return searchFn;
}
