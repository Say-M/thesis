import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type { ResponseType } from "@repo/common/schemas/response";
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@repo/common/enums/invoice";
import type { CreateTransactionSchemaType } from "@repo/common/schemas/transaction";
import type { Transaction } from "@repo/common/models/transaction";

export type TransactionListItem = Omit<Transaction, "_id"> & {
  _id: string;
};

export function useListTransactions(invoiceId: string | null) {
  const api = useApi();
  return useQuery<
    ResponseType & { data: { transactions: TransactionListItem[] } }
  >({
    queryKey: ["invoices", invoiceId, "transactions"],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${invoiceId}/transactions`);
      return data;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateTransaction(invoiceId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionSchemaType) => {
      const { data } = await api.post(
        `/invoices/${invoiceId}/transactions`,
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Transaction recorded");
      queryClient.invalidateQueries({
        queryKey: ["invoices", invoiceId, "transactions"],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["invoices", invoiceId],
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Failed to record transaction",
      );
    },
  });
}

export function useUpdateTransaction(invoiceId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      status,
    }: {
      transactionId: string;
      status: string;
    }) => {
      const { data } = await api.patch(
        `/invoices/${invoiceId}/transactions/${transactionId}`,
        { status },
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Payment status updated");
      queryClient.invalidateQueries({
        queryKey: ["invoices", invoiceId, "transactions"],
      });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({
        queryKey: ["invoices", invoiceId],
      });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update status");
    },
  });
}

export { TransactionStatus, TransactionType, PaymentMethod };
