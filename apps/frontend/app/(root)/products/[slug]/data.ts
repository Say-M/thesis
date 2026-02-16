import { cache } from "react";
import axios from "axios";
import { ProductDetail } from "@/hooks/api/products";
import { SeoDetail } from "@/hooks/api/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Cached: fetch product by slug. Used by generateMetadata and page. */
export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    try {
      if (!API_BASE || !slug) return null;
      const { data } = await axios.get(
        `${API_BASE}products/slug/${encodeURIComponent(slug)}`,
      );
      return data?.data?.product ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);

/** Cached: fetch SEO by entity id and type (e.g. productId, "product"). */
export const getSeoByTypeId = cache(
  async (id: string, type: string): Promise<SeoDetail | null> => {
    try {
      if (!API_BASE || !id) return null;
      const { data } = await axios.get(`${API_BASE}seo/${id}?type=${type}`);
      return data?.data?.seo ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);
