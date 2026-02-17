import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type { UpdateConfigSchemaType } from "@repo/common/schemas/config";
import type { ResponseType } from "@repo/common/schemas/response";
import type { Asset } from "@repo/common/models/asset";
import type { Config } from "@repo/common/models/config";

const CONFIG_QUERY_KEY = ["config"] as const;

export type ConfigData = Omit<
  Config,
  "_id" | "siteLogo" | "siteFavicon" | "socials"
> & {
  _id: string;
  siteLogo?: Asset | null;
  siteFavicon?: Asset | null;
  socials?: Record<string, { name?: string; url?: string }> | null;
};

export type GetConfigResponseType = Omit<ResponseType, "data"> & {
  data: { config: ConfigData | null };
};

export const useConfig = (options?: { enabled?: boolean }) => {
  const api = useApi();
  const enabled = options?.enabled ?? true;
  return useQuery<GetConfigResponseType>({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get("/config");
      return data;
    },
    enabled,
  });
};

export const useUpdateConfig = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateConfigSchemaType) => {
      const { data } = await api.patch("/config", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Settings saved");
      queryClient.setQueryData(
        CONFIG_QUERY_KEY,
        (prev: GetConfigResponseType | undefined) =>
          prev && data?.data?.config
            ? { ...prev, data: { config: data.data.config } }
            : prev,
      );
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to save settings");
    },
  });
};
