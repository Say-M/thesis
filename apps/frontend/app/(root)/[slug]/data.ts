import { cache } from "react";
import axios from "axios";
import type { PageDetail } from "@/hooks/api/pages";
import type { SeoDetail } from "@/hooks/api/seo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Cached: fetch page by slug (public). Used by generateMetadata and page. */
export const getPageBySlug = cache(
  async (slug: string): Promise<PageDetail | null> => {
    try {
      if (!API_BASE || !slug) return null;
      const { data } = await axios.get<{ data: { page: PageDetail } }>(
        `${API_BASE}pages/slug/${encodeURIComponent(slug)}`,
      );
      return data?.data?.page ?? null;
    } catch {
      return null;
    }
  },
);

/** Cached: fetch SEO by entity id and type (e.g. pageId, "page"). */
export const getSeoByTypeId = cache(
  async (id: string, type: string): Promise<SeoDetail | null> => {
    try {
      if (!API_BASE || !id) return null;
      const { data } = await axios.get<{ data: { seo: SeoDetail } }>(
        `${API_BASE}seo/${id}?type=${encodeURIComponent(type)}`,
      );
      return data?.data?.seo ?? null;
    } catch {
      return null;
    }
  },
);
