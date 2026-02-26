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
  PageSchemaType,
  ListPageQuerySchemaType,
} from "@repo/common/schemas/page";
import type { Page } from "@repo/common/models/page";
import type { ResponseType } from "@repo/common/schemas/response";
import { SeoDetail } from "./seo";
import { UpdatePageSchemaType } from "@repo/common/schemas/page";

const PAGES_QUERY_KEY = ["pages"] as const;

export type PageListItem = Omit<Page, "_id" | "seo" | "featuredImage"> & {
  _id: string;
  featuredImage?: { _id: string; name: string; path: string };
  seo?: SeoDetail;
};

export type PageDetail = PageListItem;

export type ListPagesResponseType = Omit<ResponseType, "data"> & {
  data: PageListItem[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const useListPages = (
  params: Partial<
    Omit<
      ListPageQuerySchemaType,
      "status" | "showInHeader" | "showInFooter" | "showInMenu" | "all"
    >
  > & {
    limit?: number;
    cursor?: string;
    status?: string;
    showInHeader?: string;
    showInFooter?: string;
    showInMenu?: string;
    all?: string;
  } = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...PAGES_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/pages`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        pages: data?.data?.pages as PageListItem[],
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

export const useGetPage = (id: string | null) => {
  const api = useApi();
  return useQuery<ResponseType & { data: PageDetail }>({
    queryKey: [...PAGES_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/pages/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreatePage = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PageSchemaType) => {
      const { data } = await api.post("/pages", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Page created");
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create page");
    },
  });
};

export const useUpdatePage = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePageSchemaType;
    }) => {
      const { data } = await api.patch(`/pages/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Page updated");
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update page");
    },
  });
};

export const useDeletePage = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/pages/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Page deleted");
      queryClient.invalidateQueries({ queryKey: PAGES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete page");
    },
  });
};
