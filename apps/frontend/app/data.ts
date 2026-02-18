import { cache } from "react";
import axios from "axios";
import type { ConfigData } from "@/hooks/api/config";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Cached: fetch config (public). Used by generateMetadata in layout. */
export const getConfig = cache(async (): Promise<ConfigData | null> => {
  try {
    if (!API_BASE) return null;
    const { data } = await axios.get<{ data: { config: ConfigData | null } }>(
      `${API_BASE}config`,
    );
    return data?.data?.config ?? null;
  } catch (error) {
    return null;
  }
});
