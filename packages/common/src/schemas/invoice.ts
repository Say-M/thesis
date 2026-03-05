import { z } from "zod";
import { InvoiceStatus, PaymentMethod, PaymentType } from "../enums/invoice";
import { cursorPaginationQuerySchema } from "./common";
import { addressSchema } from "./auth";
import { DiscountType } from "../enums/discount";
import { createTransactionSchema } from "./transaction";

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

export const createManualInvoiceSchema = invoiceSchema
  .omit({
    items: true,
    coupon: true,
    shippingChargeName: true,
    isSavedForLater: true,
  })
  .extend({
    customer: customerSchema.omit({ user: true }),
    items: z.array(
      z.object({
        name: z
          .string({ error: "Name is required" })
          .trim()
          .nonempty({ error: "Name is required" }),
        quantity: z
          .number({ error: "Quantity is required" })
          .int()
          .min(1, { message: "Quantity must be greater than 0" }),
        unitPrice: z
          .number({ error: "Unit price is required" })
          .min(0, { message: "Unit price must be greater than 0" }),
        buyingPrice: z
          .number({ error: "Buying price is required" })
          .min(0, { message: "Buying price must be greater than 0" }),
        discountType: z
          .enum(DiscountType, { error: "Invalid discount type" })
          .nullish(),
        discountValue: z
          .number({ error: "Discount value is required" })
          .min(0, { message: "Discount value must be greater than 0" })
          .nullish(),
        discountAmount: z
          .number({ error: "Discount amount is required" })
          .min(0, { message: "Discount amount must be greater than 0" })
          .nullish(),
        total: z
          .number({ error: "Total is required" })
          .min(0, { message: "Total must be greater than 0" }),
      }),
    ),
    shippingAmount: z
      .number({ error: "Shipping amount is required" })
      .min(0, { message: "Shipping amount must be greater than 0" }),
    taxAmount: z
      .number({ error: "Tax amount is required" })
      .min(0, { message: "Tax amount must be greater than 0" }),
    transaction: createTransactionSchema,
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
export type CreateManualInvoiceSchemaType = z.infer<
  typeof createManualInvoiceSchema
>;
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
