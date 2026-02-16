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
  CreateCategorySchemaType,
  UpdateCategorySchemaType,
  ListCategoryQuerySchemaType,
} from "@app/backend/schemas/category";
import type { Category } from "@app/backend/models/category";
import type { ResponseType } from "@repo/common/schemas/response";

const CATEGORIES_QUERY_KEY = ["categories"] as const;

export type CategoryDetail = Omit<Category, "_id" | "seo"> & {
  _id: string;
  thumbnail?: { _id: string; name: string; path: string };
  parentCategory?: { _id: string; name: string };
  seo?: string | null;
};

export type ListCategoriesResponseType = Omit<ResponseType, "data"> & {
  data: {
    categories: CategoryDetail[];
  };
};

export const useListCategories = (
  params: Partial<
    Omit<ListCategoryQuerySchemaType, "status" | "featured" | "type" | "all">
  > & {
    limit?: number;
    cursor?: string;
    status?: string;
    featured?: string;
    type?: string;
    parentCategories?: string;
    all?: string;
  } = {},
) => {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/categories`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        categories: data?.data?.categories as CategoryDetail[],
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

export const useGetCategory = (id: string | null) => {
  const api = useApi();
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategorySchemaType) => {
      const { data } = await api.post("/categories", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Category created");
      queryClient.setQueriesData(
        { queryKey: [...CATEGORIES_QUERY_KEY, "list"] },
        (oldData: { data: { categories: Category[] } }) => {
          return {
            ...oldData,
            data: {
              categories: [...oldData?.data?.categories, data?.data?.category],
            },
          };
        },
      );
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategorySchemaType;
    }) => {
      const { data } = await api.patch(`/categories/${id}`, payload);
      return data;
    },
    onSuccess: (data, { id }) => {
      toast.success(data?.message ?? "Category updated");
      queryClient.setQueriesData(
        { queryKey: [...CATEGORIES_QUERY_KEY] },
        (oldData: { data: { categories: CategoryDetail[] } }) => {
          const categories = oldData.data.categories.map((c) => {
            if (c._id === id) {
              return { ...c, ...data?.data?.category };
            }
            return c;
          });
          console.log({ categories });
          return {
            ...oldData,
            data: { categories },
          };
        },
      );
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update category");
    },
  });
};

export const useDeleteCategory = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/categories/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Category deleted");
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete category");
    },
  });
};
