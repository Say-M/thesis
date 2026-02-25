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
} from "@repo/common/schemas/invoice";
import type { Invoice } from "@repo/common/models/invoice";
import type { ResponseType } from "@repo/common/schemas/response";
import { InvoiceStatus } from "@repo/common/enums/invoice";

const INVOICES_QUERY_KEY = ["invoices"] as const;

export type InvoiceListItem = Invoice & {
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
  // Transaction calculation fields
  paidAmount?: number;
  refundedAmount?: number;
  effectivePaid?: number;
  remainingBalance?: number;
  isFullyPaid?: boolean;
  paymentPercentage?: number;
  totalTransactions?: number;
  paidTransactions?: number;
  refundedTransactions?: number;
};

export type InvoiceDetail = InvoiceListItem & {
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
  shippingAddress?: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
  };
  // Transaction calculation fields (inherited from InvoiceListItem)
  paidAmount?: number;
  refundedAmount?: number;
  effectivePaid?: number;
  remainingBalance?: number;
  isFullyPaid?: boolean;
  paymentPercentage?: number;
  totalTransactions?: number;
  paidTransactions?: number;
  refundedTransactions?: number;
};

export type ListInvoicesResponseType = Omit<ResponseType, "data"> & {
  data: InvoiceListItem[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const useListInvoices = (
  params: Partial<ListInvoiceQuerySchemaType> & {
    limit?: number;
    cursor?: string;
  } = {},
) => {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: [...INVOICES_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/invoices`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        invoices: data?.data?.invoices as InvoiceListItem[],
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

export const useInvoiceStatusCount = () => {
  const api = useApi();
  return useQuery<
    {
      _id: string;
      count: number;
    }[]
  >({
    queryKey: [...INVOICES_QUERY_KEY, "status-count"],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/status-count`);
      const statusCount = data?.data?.statusCount as {
        _id: string;
        count: number;
      }[];
      return Object.values(InvoiceStatus).map((status) => {
        return {
          _id: status,
          count: statusCount.find((item) => item._id === status)?.count ?? 0,
        };
      });
    },
  });
};

export const useGetInvoice = (id: string | null) => {
  const api = useApi();
  return useQuery<ResponseType & { data: { invoice: InvoiceDetail } }>({
    queryKey: [...INVOICES_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoiceSchemaType) => {
      const { data } = await api.post("/invoices", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Invoice created");
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create invoice");
    },
  });
};

export const useUpdateInvoice = () => {
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
      toast.success(data?.message ?? "Invoice updated");
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update invoice");
    },
  });
};

export const useDeleteInvoice = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/invoices/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Invoice deleted");
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete invoice");
    },
  });
};
