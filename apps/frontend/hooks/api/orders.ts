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
  CreateInvoiceSchemaType,
  UpdateInvoiceSchemaType,
  ListInvoiceQuerySchemaType,
} from "@app/backend/schemas/invoice";
import type { Invoice } from "@app/backend/models/invoice";
import type { ResponseType } from "@repo/common/schemas/response";
import { InvoiceType } from "@app/backend/enums/invoice";

const ORDERS_QUERY_KEY = ["orders"] as const;

export type OrderListItem = Invoice & {
  _id: string;
  customer?: {
    name: string;
    email?: string;
    phone?: string;
    user?: string;
  };
  coupon?: {
    _id: string;
    code: string;
  };
};

export type OrderDetail = OrderListItem & {
  items: Array<{
    product: string | { _id: string; name: string };
    variantId?: string;
    name: string;
    variantLabel?: string;
    quantity: number;
    unitPrice: number;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    total: number;
  }>;
  billingAddress?: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  shippingAddress?: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
};

export type ListOrdersResponseType = Omit<ResponseType, "data"> & {
  data: OrderListItem[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const useListOrders = (
  params: Partial<ListInvoiceQuerySchemaType> & {
    limit?: number;
    cursor?: string;
  } = {},
) => {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: [...ORDERS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/invoices`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        orders: data?.data?.invoices as OrderListItem[],
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

export const useGetOrder = (id: string | null) => {
  const api = useApi();
  return useQuery<ResponseType & { data: { invoice: OrderDetail } }>({
    queryKey: [...ORDERS_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoiceSchemaType) => {
      const { data } = await api.post("/invoices", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Order created");
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create order");
    },
  });
};

export const useUpdateOrder = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInvoiceSchemaType;
    }) => {
      const { data } = await api.patch(`/invoices/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Order updated");
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update order");
    },
  });
};
