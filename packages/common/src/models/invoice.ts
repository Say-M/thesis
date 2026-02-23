import { Schema, model, InferSchemaType, Types } from "mongoose";
import { DiscountType } from "../enums/discount";
import {
  InvoiceStatus,
  InvoiceType,
  TransactionStatus,
  TransactionType,
  PaymentType,
} from "../enums/invoice";
import { addressSchema } from "./user";

const lineItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Types.ObjectId },
    name: { type: String, required: true, trim: true },
    variantLabel: { type: String, trim: true },
    unit: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    buyingPrice: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: DiscountType,
      default: DiscountType.PERCENTAGE,
    },
    discountValue: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    user: { type: Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: InvoiceType,
      default: InvoiceType.ONLINE,
      index: true,
    },
    paymentType: {
      type: String,
      enum: PaymentType,
      required: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
        message: "At least one item is required",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    coupon: { type: Types.ObjectId, ref: "Coupon" },
    couponDiscountAmount: { type: Number, min: 0, default: 0 },
    shippingAmount: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    codAmount: { type: Number, min: 0, max: 100, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: InvoiceStatus,
      default: InvoiceStatus.PENDING,
      index: true,
    },
    currency: { type: String, trim: true, default: "BDT" },
    notes: { type: String, trim: true },
    shippingAddress: { type: addressSchema },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for populating paid transactions (successful payment transactions)
schema.virtual("paidTransactions", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "invoice",
  options: {
    match: {
      status: TransactionStatus.SUCCESS,
      type: TransactionType.PAYMENT,
    },
  },
  justOne: false,
});

// Virtual for populating refunded transactions (successful refund transactions)
schema.virtual("refundedTransactions", {
  ref: "Transaction",
  localField: "_id",
  foreignField: "invoice",
  options: {
    match: {
      status: TransactionStatus.SUCCESS,
      type: TransactionType.REFUND,
    },
  },
  justOne: false,
});

// Virtual for calculating total paid amount (works with populated paidTransactions)
schema.virtual("paidAmount").get(function (this: any) {
  const transactions = this.paidTransactions || [];
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
});

// Virtual for calculating total refunded amount (works with populated refundedTransactions)
schema.virtual("refundedAmount").get(function (this: any) {
  const transactions = this.refundedTransactions || [];
  if (!Array.isArray(transactions)) return 0;
  return transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
});

// Virtual for calculating remaining balance
schema.virtual("remainingBalance").get(function (this: any) {
  const paid = this.paidAmount || 0;
  const refunded = this.refundedAmount || 0;
  return Math.max(0, this.total - paid + refunded);
});

// Virtual for checking if invoice is fully paid
schema.virtual("isFullyPaid").get(function (this: any) {
  return this.remainingBalance <= 0;
});

// Virtual for calculating payment percentage
schema.virtual("paymentPercentage").get(function (this: any) {
  if (this.total === 0) return 100;
  const paid = this.paidAmount || 0;
  const refunded = this.refundedAmount || 0;
  const netPaid = paid - refunded;
  return Math.min(100, Math.max(0, (netPaid / this.total) * 100));
});

// Instance method to calculate transaction totals (more efficient than virtuals for aggregation)
schema.methods.calculateTransactionTotals = async function () {
  const TransactionModel = model("Transaction");
  const [paidResult, refundedResult, totalCount] = await Promise.all([
    TransactionModel.aggregate([
      {
        $match: {
          invoice: this._id,
          status: TransactionStatus.SUCCESS,
          type: TransactionType.PAYMENT,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    TransactionModel.aggregate([
      {
        $match: {
          invoice: this._id,
          status: TransactionStatus.SUCCESS,
          type: TransactionType.REFUND,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    TransactionModel.countDocuments({ invoice: this._id }),
  ]);

  const paidAmount = paidResult[0]?.total || 0;
  const refundedAmount = refundedResult[0]?.total || 0;
  const paidCount = paidResult[0]?.count || 0;
  const refundedCount = refundedResult[0]?.count || 0;
  const remainingBalance = Math.max(
    0,
    this.total - paidAmount + refundedAmount,
  );
  const isFullyPaid = remainingBalance <= 0;
  const paymentPercentage =
    this.total === 0
      ? 100
      : Math.min(
          100,
          Math.max(0, ((paidAmount - refundedAmount) / this.total) * 100),
        );

  return {
    paidAmount,
    refundedAmount,
    remainingBalance,
    isFullyPaid,
    paymentPercentage,
    totalTransactions: totalCount,
    paidTransactions: paidCount,
    refundedTransactions: refundedCount,
  };
};

export const Invoice = model("Invoice", schema);
export type Invoice = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  paidTransactions?: Array<{ amount: number; _id: Types.ObjectId }>;
  refundedTransactions?: Array<{ amount: number; _id: Types.ObjectId }>;
  paidAmount?: number;
  refundedAmount?: number;
  remainingBalance?: number;
  isFullyPaid?: boolean;
  paymentPercentage?: number;
  calculateTransactionTotals?: () => Promise<{
    paidAmount: number;
    refundedAmount: number;
    remainingBalance: number;
    isFullyPaid: boolean;
    paymentPercentage: number;
    totalTransactions: number;
    paidTransactions: number;
    refundedTransactions: number;
  }>;
};
