import { useCallback } from "react";
import useApi from "./use-api";

export type UserSearchOption = {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  label: string;
  value: string;
};

export type UseUserSearchOptions = {
  limit?: number;
  /** Exclude this user id from results */
  excludeId?: string | null;
};

/**
 * Returns a search function for use with ComboboxApiSearch to fetch users.
 */
export function useUserSearch(options: UseUserSearchOptions = {}) {
  const api = useApi();
  const { limit = 20, excludeId } = options;

  const searchFn = useCallback(
    async (query: string): Promise<UserSearchOption[]> => {
      const params = new URLSearchParams();
      params.set("search", query);
      params.set("limit", String(limit));
      params.set("status", "true");
      const { data } = await api.get(`/users?${params.toString()}`);
      const list = (data?.data?.users ?? []) as {
        _id: string;
        name: string;
        email?: string;
        mobile?: string;
      }[];
      let filtered = list;
      if (excludeId) {
        filtered = filtered.filter((u) => u._id !== excludeId);
      }
      return filtered.map((u) => ({
        ...u,
        label: `${u.name}${u.email ? ` (${u.email})` : u.mobile ? ` (${u.mobile})` : ""}`,
        value: u._id,
      }));
    },
    [api, limit, excludeId],
  );

  return searchFn;
}
