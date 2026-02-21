import { z } from "zod";

export enum DeliveryType {
  HOME_DELIVERY = 0,
  POINT_DELIVERY = 1,
}

export const processSteadfastInvoicesSchema = z.object({
  invoice: z.string().trim().nonempty({ message: "Invoice is required" }),
  cod_amount: z
    .number()
    .min(0, { message: "COD amount must be greater than 0" }),
  note: z.string().trim().nullish(),
  item_description: z.string().trim().nullish(),
  total_lot: z
    .number()
    .min(0, { message: "Total lot must be greater than 0" })
    .nullish(),
  delivery_type: z.enum(DeliveryType),
});

export type ProcessSteadfastInvoicesSchemaType = z.infer<
  typeof processSteadfastInvoicesSchema
>;
