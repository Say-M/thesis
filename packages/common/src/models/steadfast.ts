import { Schema, model, InferSchemaType, Types } from "mongoose";
import { DeliveryType } from "../schemas/steadfast";

const schema = new Schema(
  {
    invoice: {
      type: Types.ObjectId,
      ref: "Invoice",
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    consignment_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tracking_code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
    },
    recipient_name: {
      type: String,
      required: true,
      trim: true,
    },
    recipient_phone: {
      type: String,
      required: true,
      trim: true,
    },
    recipient_email: {
      type: String,
      trim: true,
    },
    alternative_phone: {
      type: String,
      trim: true,
    },
    recipient_address: {
      type: String,
      required: true,
      trim: true,
    },
    cod_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    item_description: {
      type: String,
      trim: true,
    },
    total_lot: {
      type: Number,
      min: 0,
    },
    delivery_type: {
      type: String,
      enum: DeliveryType,
      required: true,
    },
  },
  { timestamps: true },
);

export const Steadfast = model("Steadfast", schema);
