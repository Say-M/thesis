import useApi from "../use-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProcessSteadfastInvoicesSchemaType } from "@repo/common/schemas/steadfast";
import { toast } from "sonner";
import { AxiosError } from "axios";

export const useProcessSteadfast = () => {
  const api = useApi();
  //   const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProcessSteadfastInvoicesSchemaType) => {
      const { data } = await api.post("/steadfast/create_order", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Steadfast order created");
      //   queryClient.invalidateQueries({ queryKey: STEADFAST_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Failed to create Steadfast order",
      );
    },
  });
};

export const useGetSteadfastDeliveryStatus = ({
  id,
  invoice,
  trackingCode,
}: {
  id?: string;
  invoice?: string;
  trackingCode?: string;
}) => {
  const api = useApi();
  return useQuery({
    queryKey: ["steadfast", "delivery_status"],
    queryFn: async () => {
      const { data } = await api.get("/steadfast/delivery_status", {
        params: { id, invoice, trackingCode },
      });
      return data;
    },
    enabled: !!id || !!invoice || !!trackingCode,
  });
};
