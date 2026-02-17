import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type {
  CreateAssetSchemaType,
  CreateBulkAssetSchemaType,
  ListAssetQuerySchemaType,
} from "@repo/common/schemas/asset";
import type { Asset } from "@repo/common/models/asset";
import type { ResponseType } from "@repo/common/schemas/response";

const ASSETS_QUERY_KEY = ["assets"] as const;

export type AssetListItem = Asset & { _id: string };

export type ListAssetsResponseType = Omit<ResponseType, "data"> & {
  data: AssetListItem[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const useListAssets = (
  query: Partial<ListAssetQuerySchemaType> & {
    limit?: number;
    cursor?: string;
  } = {},
) => {
  const api = useApi();
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.provider) params.set("provider", query.provider);

  return useQuery<ListAssetsResponseType>({
    queryKey: [...ASSETS_QUERY_KEY, "list", query],
    queryFn: async () => {
      const { data } = await api.get(`/assets?${params.toString()}`);
      return data;
    },
  });
};

export const useListAssetsInfinite = (
  params: Partial<ListAssetQuerySchemaType> = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...ASSETS_QUERY_KEY, "list-infinite", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/assets`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        assets: data?.data?.assets as AssetListItem[],
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

export const useCreateAsset = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAssetSchemaType) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      if (payload.name) formData.append("name", payload.name);
      if (payload.tags?.length) {
        formData.append("tags", JSON.stringify(payload.tags));
      }
      const { data } = await api.post("/assets", formData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Asset uploaded");
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to upload asset");
    },
  });
};

export const useCreateBulkAssets = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBulkAssetSchemaType) => {
      const formData = new FormData();
      payload.files.forEach((file) => formData.append("files", file));
      const { data } = await api.post("/assets/bulk", formData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Assets uploaded");
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to upload assets");
    },
  });
};

export const useDeleteAsset = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/assets/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Asset deleted");
      queryClient.invalidateQueries({ queryKey: ASSETS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete asset");
    },
  });
};
