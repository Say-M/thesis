import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type {
  CreateBannerSchemaType,
  UpdateBannerSchemaType,
  ListBannerQuerySchemaType,
} from "@repo/common/schemas/banner";
import type { Banner } from "@repo/common/models/banner";
import type { ResponseType } from "@repo/common/schemas/response";

const BANNERS_QUERY_KEY = ["banners"] as const;

export type BannerListItem = Omit<Banner, "_id"> & {
  _id: string;
  image?: { _id: string; name: string; path: string };
};

export type ListBannersResponseType = Omit<ResponseType, "data"> & {
  data: { banners: BannerListItem[] };
};

export const useListBanners = (
  params: Partial<
    Omit<ListBannerQuerySchemaType, "status" | "all"> & {
      status?: string;
      all?: string;
    }
  > = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...BANNERS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/banners`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        banners: data?.data?.banners as BannerListItem[],
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

export const useGetBanner = (id: string | null) => {
  const api = useApi();
  return useQuery({
    queryKey: [...BANNERS_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/banners/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateBanner = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBannerSchemaType) => {
      const { data } = await api.post("/banners", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Banner created");
      queryClient.invalidateQueries({ queryKey: [...BANNERS_QUERY_KEY] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create banner");
    },
  });
};

export const useUpdateBanner = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBannerSchemaType;
    }) => {
      const { data } = await api.patch(`/banners/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Banner updated");
      queryClient.invalidateQueries({ queryKey: [...BANNERS_QUERY_KEY] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update banner");
    },
  });
};

export const useDeleteBanner = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/banners/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Banner deleted");
      queryClient.invalidateQueries({ queryKey: [...BANNERS_QUERY_KEY] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete banner");
    },
  });
};
