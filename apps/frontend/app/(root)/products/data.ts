import { cache } from "react";
import axios from "axios";
import { CategoryDetail } from "@/hooks/api/categories";
import { SeoDetail } from "@/hooks/api/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Cached: fetch category by id. For SEO metadata when ?category=id. */
export const getCategoryById = cache(
  async (id: string): Promise<CategoryDetail | null> => {
    try {
      if (!API_BASE || !id) return null;
      const { data } = await axios.get(`${API_BASE}categories/${id}`);
      return data?.data?.category ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);

/** Cached: fetch SEO by entity id and type (e.g. categoryId, "category"). */
export const getSeoByTypeId = cache(
  async (id: string, type: string): Promise<SeoDetail | null> => {
    if (!API_BASE || !id) return null;
    try {
      const { data } = await axios.get(`${API_BASE}seo/${id}?type=${type}`);
      return data?.data?.seo ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);
