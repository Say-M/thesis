import { HTTPException } from "hono/http-exception";
import mongoose, { Types } from "mongoose";
import { Transaction } from "@repo/common/models/transaction";
import { Invoice } from "@repo/common/models/invoice";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateTransactionSchemaType,
  UpdateTransactionSchemaType,
} from "@repo/common/schemas/transaction";
import {
  InvoiceStatus,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
} from "@repo/common/enums/invoice";

export const listTransactionsByInvoiceService = async (
  invoiceId: string,
): Promise<ResponseType> => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  const transactions = await Transaction.find({ invoice: invoiceId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { transactions },
  };
};

export const updateTransactionService = async (
  invoiceId: string,
  transactionId: string,
  payload: UpdateTransactionSchemaType,
): Promise<ResponseType> => {
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  const existing = await Transaction.findOne({
    _id: transactionId,
    invoice: invoiceId,
  }).lean();
  if (!existing)
    throw new HTTPException(404, {
      message: "Transaction not found or does not belong to this invoice",
    });

  // Before setting status to Success, validate so we don't allow overpayment or over-refund
  if (payload.status === TransactionStatus.SUCCESS) {
    const { paidAmount, refundedAmount } =
      await getTransactionTotals(invoiceId);
    const wasSuccessPayment =
      existing.status === TransactionStatus.SUCCESS &&
      existing.type === TransactionType.PAYMENT;
    const wasSuccessRefund =
      existing.status === TransactionStatus.SUCCESS &&
      existing.type === TransactionType.REFUND;
    const willBeSuccessPayment = existing.type === TransactionType.PAYMENT;
    const willBeSuccessRefund = existing.type === TransactionType.REFUND;

    if (willBeSuccessPayment) {
      // After update: paid total = current − (if this was already counted) + (we're setting success so count it)
      const newPaidTotal =
        paidAmount -
        (wasSuccessPayment ? existing.amount : 0) +
        existing.amount;
      const effectivePaid = newPaidTotal - refundedAmount;
      if (effectivePaid > invoice.total) {
        throw new HTTPException(400, {
          message: `Marking this payment as Success would exceed the invoice total. Invoice total: ${invoice.total}, would result in overpayment: ${effectivePaid}.`,
        });
      }
    }

    if (willBeSuccessRefund) {
      const newRefundedTotal =
        refundedAmount -
        (wasSuccessRefund ? existing.amount : 0) +
        existing.amount;
      if (newRefundedTotal > paidAmount) {
        throw new HTTPException(400, {
          message: `Marking this refund as Success would exceed refundable amount. Total paid: ${paidAmount}, refunds would be: ${newRefundedTotal}.`,
        });
      }
    }
  }

  // When changing a success refund to Pending/Failed, effective paid must not exceed invoice total
  if (
    payload.status !== TransactionStatus.SUCCESS &&
    existing.status === TransactionStatus.SUCCESS &&
    existing.type === TransactionType.REFUND
  ) {
    const { paidAmount, refundedAmount } =
      await getTransactionTotals(invoiceId);
    const newRefundedTotal = refundedAmount - existing.amount;
    const effectivePaidAfter = paidAmount - newRefundedTotal;
    if (effectivePaidAfter > invoice.total) {
      throw new HTTPException(400, {
        message: `Cannot mark this refund as non-Success: effective paid would exceed invoice total (${invoice.total}). Would be ${effectivePaidAfter}.`,
      });
    }
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, invoice: invoiceId },
    { $set: payload },
    { new: true },
  ).lean();

  if (!transaction)
    throw new HTTPException(500, { message: "Failed to update transaction" });

  return {
    status: 200,
    message: "Transaction updated",
    timestamp: new Date().toISOString(),
    data: { transaction },
  };
};

/** Get total successful payment and refund amounts for an invoice (optionally inside a session for transactional reads) */
async function getTransactionTotals(
  invoiceId: string,
  session?: mongoose.mongo.ClientSession,
): Promise<{
  paidAmount: number;
  refundedAmount: number;
  refundableAmount: number;
}> {
  const invoiceObjectId = new mongoose.Types.ObjectId(invoiceId);
  const paidPipe = Transaction.aggregate([
    {
      $match: {
        invoice: invoiceObjectId,
        status: TransactionStatus.SUCCESS,
        type: TransactionType.PAYMENT,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const refundedPipe = Transaction.aggregate([
    {
      $match: {
        invoice: invoiceObjectId,
        status: TransactionStatus.SUCCESS,
        type: TransactionType.REFUND,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  if (session) {
    paidPipe.session(session);
    refundedPipe.session(session);
  }
  const [paidResult, refundedResult] = await Promise.all([
    paidPipe.exec(),
    refundedPipe.exec(),
  ]);
  const paidAmount = paidResult[0]?.total ?? 0;
  const refundedAmount = refundedResult[0]?.total ?? 0;
  const refundableAmount = Math.max(0, paidAmount - refundedAmount);
  return { paidAmount, refundedAmount, refundableAmount };
}

export const createTransactionService = async (
  invoiceId: string,
  payload: CreateTransactionSchemaType,
  other?: Record<string, any>,
): Promise<ResponseType> => {
  let invoice;
  if (Types.ObjectId.isValid(invoiceId)) {
    invoice = (await Invoice.findById(invoiceId))?.toObject();
  } else {
    invoice = (await Invoice.findOne({ invoiceNumber: invoiceId }))?.toObject();
  }

  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  // Reject new transactions when invoice is Cancelled
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new HTTPException(400, {
      message: "Cannot add transactions to a cancelled invoice",
    });
  }

  // PAYMENT: reject overpayment (amount cannot exceed remaining balance)
  if (
    payload.type === TransactionType.PAYMENT &&
    payload.paymentMethod !== PaymentMethod.SSLCOMMERZ
  ) {
    const { paidAmount, refundedAmount } =
      await getTransactionTotals(invoiceId);
    const remainingBalance = Math.max(
      0,
      invoice.total - paidAmount + refundedAmount,
    );
    if (payload.amount > remainingBalance) {
      throw new HTTPException(400, {
        message:
          remainingBalance <= 0
            ? "Invoice is already fully paid"
            : `Payment amount cannot exceed remaining balance (${remainingBalance})`,
      });
    }
  }

  // For REFUND, run inside a transaction so the read and write are atomic:
  // two concurrent refunds cannot both pass the refundableAmount check.
  if (
    payload.type === TransactionType.REFUND &&
    payload.paymentMethod !== PaymentMethod.SSLCOMMERZ
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { refundableAmount } = await getTransactionTotals(
        invoiceId,
        session,
      );
      if (payload.amount > refundableAmount) {
        throw new HTTPException(400, {
          message:
            refundableAmount <= 0
              ? "No payment has been made to refund"
              : `Refund amount cannot exceed refundable amount (${refundableAmount})`,
        });
      }
      const [createdDoc] = await Transaction.create(
        [
          {
            invoice: invoiceId,
            amount: payload.amount,
            type: payload.type,
            status: payload.status ?? TransactionStatus.SUCCESS,
            paymentMethod: payload.paymentMethod ?? PaymentMethod.CASH,
            reference: payload.reference,
          },
        ],
        { session },
      );
      if (!createdDoc)
        throw new HTTPException(500, {
          message: "Failed to create transaction",
        });
      const created = await Transaction.findById(createdDoc._id)
        .session(session)
        .lean();
      await session.commitTransaction();
      if (!created)
        throw new HTTPException(500, {
          message: "Failed to create transaction",
        });
      return {
        status: 201,
        message: "Refund recorded",
        timestamp: new Date().toISOString(),
        data: { transaction: created },
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  const transaction = await Transaction.create({
    invoice: invoiceId,
    amount: payload.amount,
    type: payload.type,
    status: payload.status ?? TransactionStatus.SUCCESS,
    paymentMethod: payload.paymentMethod ?? PaymentMethod.CASH,
    reference: payload.reference,
    other,
  });

  const created = await Transaction.findById(transaction._id).lean();
  if (!created)
    throw new HTTPException(500, { message: "Failed to create transaction" });

  return {
    status: 201,
    message: "Payment recorded",
    timestamp: new Date().toISOString(),
    data: { transaction: created },
  };
};
