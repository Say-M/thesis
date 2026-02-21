import { z } from "zod";
import {
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentType,
} from "../enums/invoice";
import { cursorPaginationQuerySchema } from "./common";
import { addressSchema } from "./auth";

const lineItemSchema = z.object({
  product: z
    .string({ error: "Product is required" })
    .trim()
    .nonempty({ error: "Product is required" }),
  variantId: z.string().trim().nullish(),
  quantity: z
    .number({ error: "Quantity is required" })
    .int()
    .min(1, { message: "Quantity must be greater than 0" }),
});

const customerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .nonempty({ error: "Name is required" }),
  email: z.email({ error: "Invalid email address" }).trim().nullish(),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .nonempty({ error: "Phone is required" }),
  user: z.string().trim().nullish(),
});

export const invoiceSchema = z.object({
  type: z.enum(InvoiceType, { error: "Invalid invoice type" }).nullish(),
  paymentType: z.enum(PaymentType, { error: "Invalid payment type" }),
  customer: customerSchema,
  items: z
    .array(lineItemSchema)
    .min(1, { message: "At least one item is required" }),
  coupon: z.string({ error: "Invalid coupon" }).trim().nullish(),
  notes: z.string({ error: "Invalid notes" }).trim().nullish(),
  isSavedForLater: z.boolean().nullish(),
  shippingAddress: addressSchema,
  shippingChargeName: z.string().trim().nullish(),
  transaction: z.object({
    paymentMethod: z
      .enum(PaymentMethod, { error: "Invalid payment method" })
      .nullish(),
    reference: z.string({ error: "Reference is required" }).trim().nullish(),
  }),
});

export const createInvoiceSchema = invoiceSchema.superRefine((data, ctx) => {
  if (data.paymentType === PaymentType.ONLINE) {
    if (!data.transaction.paymentMethod) {
      ctx.addIssue({
        code: "custom",
        path: ["transaction", "paymentMethod"],
        message: "Payment method is required for online payment",
      });
    }
    if (!data.transaction.reference) {
      ctx.addIssue({
        code: "custom",
        path: ["transaction", "reference"],
        message: "Reference is required for online payment",
      });
    }
  }
});

export const updateInvoiceSchema = z
  .object({
    customer: customerSchema.omit({ user: true }).partial(),
    invoiceNumber: z
      .string({ error: "Invoice number is required" })
      .trim()
      .nullish(),
    status: z.enum(InvoiceStatus, { error: "Invalid status" }).nullish(),
    notes: z.string({ error: "Invalid notes" }).trim().nullish(),
    shippingAddress: addressSchema.partial(),
  })
  .partial();

export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchemaType = z.infer<typeof updateInvoiceSchema>;

export const listInvoiceQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  status: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v)),
  type: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v)),
  userId: z.string().trim().nullish(),
});

export type ListInvoiceQuerySchemaType = z.infer<typeof listInvoiceQuerySchema>;
