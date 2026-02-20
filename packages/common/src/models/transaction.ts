import { Schema, model, InferSchemaType, Types } from "mongoose";
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "../enums/invoice";

const schema = new Schema(
  {
    invoice: {
      type: Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    store_amount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: TransactionStatus,
      default: TransactionStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: PaymentMethod,
    },
    type: {
      type: String,
      enum: TransactionType,
      required: true,
    },
    reference: { type: String, trim: true },
    other: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Virtual for checking if transaction is successful
schema.virtual("isSuccessful").get(function () {
  return this.status === TransactionStatus.SUCCESS;
});

// Virtual for checking if transaction is a payment
schema.virtual("isPayment").get(function () {
  return this.type === TransactionType.PAYMENT;
});

// Virtual for checking if transaction is a refund
schema.virtual("isRefund").get(function () {
  return this.type === TransactionType.REFUND;
});

// Ensure virtuals are included in JSON output
schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

export const Transaction = model("Transaction", schema);
export type Transaction = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  isSuccessful?: boolean;
  isPayment?: boolean;
  isRefund?: boolean;
};
