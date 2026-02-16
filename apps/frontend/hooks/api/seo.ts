import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type { ResponseType } from "@repo/common/schemas/response";
import type { CreateOrUpdateSeoSchemaType } from "@app/backend/schemas/seo";
import type { Seo } from "@app/backend/models/seo";

const SEO_QUERY_KEY = ["seo"] as const;

export type SeoDetail = Omit<Seo, "_id" | "ogImage" | "twitterImage"> & {
  _id: string;
  ogImage?: { _id: string; name: string; path: string };
  twitterImage?: { _id: string; name: string; path: string };
};

export type GetSeoResponseType = Omit<ResponseType, "data"> & {
  data: { seo: SeoDetail };
};

export type CreateOrUpdateSeoResponseType = Omit<ResponseType, "data"> & {
  data: { seo: SeoDetail };
};

export const useGetSeo = (id: string | null, type?: string) => {
  const api = useApi();
  return useQuery<GetSeoResponseType>({
    queryKey: [...SEO_QUERY_KEY, id, type],
    queryFn: async () => {
      const params = type ? `?type=${encodeURIComponent(type)}` : "";
      const { data } = await api.get(`/seo/${id}${params}`);
      return data;
    },
    enabled: !!id && id !== "new",
    retry: 1,
  });
};

export const useCreateOrUpdateSeo = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrUpdateSeoSchemaType) => {
      const { data } = await api.patch("/seo", payload);
      return data as CreateOrUpdateSeoResponseType;
    },
    onSuccess: (data, { id }) => {
      toast.success(data?.message ?? "SEO saved");
      queryClient.setQueriesData(
        { queryKey: [...SEO_QUERY_KEY, id] },
        (oldData: GetSeoResponseType) => {
          console.log({ oldData, data });
          return {
            ...oldData,
            data: { seo: data?.data?.seo },
          };
        },
      );
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to save SEO");
    },
  });
};

export const useDeleteSeo = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/seo/${id}`);
      return data as ResponseType;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "SEO deleted");
      queryClient.invalidateQueries({ queryKey: SEO_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete SEO");
    },
  });
};
