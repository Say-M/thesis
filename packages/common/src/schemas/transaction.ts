import { z } from "zod";
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "../enums/invoice";

export const createTransactionSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .min(0.01, { message: "Amount must be greater than 0" }),
  store_amount: z
    .number()
    .min(0, { message: "Store amount must be greater than 0" })
    .nullish(),
  type: z.enum(TransactionType),
  status: z.enum(TransactionStatus, { error: "Status is required" }),
  paymentMethod: z.enum(PaymentMethod, { error: "Payment method is required" }),
  reference: z.string({ error: "Reference is required" }).trim().nullish(),
});

export type CreateTransactionSchemaType = z.infer<
  typeof createTransactionSchema
>;

export const updateTransactionSchema = z.object({
  status: z.enum(TransactionStatus, { error: "Invalid status" }),
});

export type UpdateTransactionSchemaType = z.infer<
  typeof updateTransactionSchema
>;
