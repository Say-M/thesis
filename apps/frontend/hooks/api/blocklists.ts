import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type {
  CreateBlocklistSchemaType,
  ListBlocklistQuerySchemaType,
} from "@repo/common/schemas/blocklist";
import type { Blocklist } from "@repo/common/models/blocklist";
import type { ResponseType } from "@repo/common/schemas/response";

const BLOCKLISTS_QUERY_KEY = ["blocklists"] as const;

export type BlocklistListItem = Omit<Blocklist, "_id"> & {
  _id: string;
};

export type ListBlocklistsResponseType = Omit<ResponseType, "data"> & {
  data: { blocklists: BlocklistListItem[] };
};

export const useListBlocklists = (
  params: Partial<
    Omit<ListBlocklistQuerySchemaType, "all"> & {
      all?: string;
    }
  > = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...BLOCKLISTS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/blocklist`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        blocklists: data?.data?.blocklists as BlocklistListItem[],
        nextPage: data?.pagination?.hasMore
          ? data?.pagination?.nextCursor
          : undefined,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: ({ nextPage }) => {
      return nextPage;
    },
  });
};

export const useCreateBlocklist = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBlocklistSchemaType) => {
      const { data } = await api.post("/blocklist", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Blocklist created");
      queryClient.invalidateQueries({ queryKey: [...BLOCKLISTS_QUERY_KEY] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Failed to create blocklist",
      );
    },
  });
};

export const useDeleteBlocklist = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/blocklist/${id}`);
      return data;
    },
    onSuccess: (data, id) => {
      toast.success(data?.message ?? "Blocklist deleted");
      queryClient.invalidateQueries({ queryKey: [...BLOCKLISTS_QUERY_KEY] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Failed to delete blocklist",
      );
    },
  });
};
