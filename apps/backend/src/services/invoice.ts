import { HTTPException } from "hono/http-exception";
import mongoose, { ProjectionType, QueryFilter, Types } from "mongoose";
import { Invoice } from "@repo/common/models/invoice";
import { Coupon } from "@repo/common/models/coupon";
import { Product } from "@repo/common/models/product";
import { Transaction } from "@repo/common/models/transaction";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateInvoiceSchemaType,
  ListInvoiceQuerySchemaType,
  UpdateInvoiceSchemaType,
} from "@repo/common/schemas/invoice";
import { User } from "@repo/common/models/user";
import { getCouponByCodeService } from "./coupon";
import { generateIDBasedOnDate } from "@/utils/customIdHelper";
import { DiscountType } from "@repo/common/enums/discount";
import {
  InvoiceStatus,
  InvoiceType,
  PaymentType,
  TransactionStatus,
  TransactionType,
} from "@repo/common/enums/invoice";
import { getLatestConfig } from "@/utils/config-helper";
import { Role } from "@repo/common/enums/role";
import { roundTo2 } from "@repo/common/utils/round-to-2";
import sslcommerz, {
  ShippingMethod,
  ProductProfile,
} from "@repo/sslcommerz/sslcommerz";

export const createInvoiceService = async (
  user: User | null | undefined,
  payload: CreateInvoiceSchemaType,
  { origin, host }: { origin?: string; host?: string },
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      items,
      customer,
      coupon: couponCode,
      type,
      notes,
      shippingAddress,
      shippingChargeName,
      // transaction: transactionPayload,
      paymentType,
    } = payload;

    // Fetch all products
    const productIds = new Set(items.map((item) => item.product));
    const products = await Product.find({
      _id: { $in: Array.from(productIds) },
    })
      .session(session)
      .lean();

    if (products.length !== productIds.size) {
      throw new HTTPException(400, {
        message: "One or more products not found",
      });
    }

    // Calculate line items with prices and discounts
    let subtotal = 0;
    const stockUpdates: Array<{
      productId: unknown;
      variantId?: unknown;
      quantity: number;
    }> = [];

    const lineItems = await Promise.all(
      items.map(async (item) => {
        const product = products.find((p) => p._id.toString() === item.product);
        if (!product) {
          throw new HTTPException(400, {
            message: "A product in your order could not be found",
          });
        }

        let unitPrice = 0;
        let variantName = null;
        let variantId = null;

        // Handle variant products
        let discountType = product.discountType || DiscountType.PERCENTAGE;
        let discountValue = product.discountValue ?? 0;
        let weight = product.weight ?? 0;
        let weightUnit = product.weightUnit ?? "";
        let unit = product.unit ?? "";
        let buyingPrice = product.buyingPrice ?? 0;

        if (product.hasVariants && item.variantId) {
          const variant = product.variants?.find(
            (v) =>
              v._id?.toString() === item.variantId ||
              String(v._id) === item.variantId,
          );
          if (!variant) {
            throw new HTTPException(400, {
              message: `Variant not found for product "${product.name}"`,
            });
          }

          variantName = variant.name;
          const variantDisplayName = `${product.name} ${variantName ? `(${variantName})` : ""}`;

          // Enforce business min/max order quantity for this variant.
          const rawVariantMin =
            typeof variant.minQuantity === "number"
              ? variant.minQuantity
              : null;
          const rawVariantMax =
            typeof variant.maxQuantity === "number"
              ? variant.maxQuantity
              : null;
          const rawProductMin =
            typeof product.minQuantity === "number"
              ? product.minQuantity
              : null;
          const rawProductMax =
            typeof product.maxQuantity === "number"
              ? product.maxQuantity
              : null;

          const minOrderQuantity =
            (rawVariantMin != null && rawVariantMin > 0
              ? rawVariantMin
              : rawProductMin != null && rawProductMin > 0
                ? rawProductMin
                : 1) ?? 1;
          const maxOrderQuantity =
            rawVariantMax != null && rawVariantMax > 0
              ? rawVariantMax
              : rawProductMax != null && rawProductMax > 0
                ? rawProductMax
                : null;

          if (
            item.quantity < minOrderQuantity ||
            (maxOrderQuantity != null && item.quantity > maxOrderQuantity)
          ) {
            throw new HTTPException(400, {
              message:
                maxOrderQuantity != null
                  ? `Quantity for ${variantDisplayName} must be between ${minOrderQuantity} and ${maxOrderQuantity}`
                  : `Quantity for ${variantDisplayName} must be at least ${minOrderQuantity}`,
            });
          }

          // Validate stock availability
          if (variant.stock < item.quantity) {
            throw new HTTPException(400, {
              message: `Insufficient stock for ${variantDisplayName}. Available: ${variant.stock}, Requested: ${item.quantity}`,
            });
          }

          unitPrice = variant.sellingPrice;
          if (unitPrice <= 0) {
            throw new HTTPException(400, {
              message: `Invalid price for ${variantDisplayName}`,
            });
          }

          variantId = variant._id;
          discountType = variant.discountType || DiscountType.PERCENTAGE;
          discountValue = variant.discountValue ?? 0;
          weight = variant.weight ?? 0;
          weightUnit = variant.weightUnit ?? "";
          unit = variant.unit ?? "";
          buyingPrice = variant.buyingPrice ?? 0;

          // Track stock update for variant
          stockUpdates.push({
            productId: product._id,
            variantId: variant._id,
            quantity: item.quantity,
          });
        } else if (!product.hasVariants) {
          // Validate stock availability
          const productStock = product.stock ?? 0;

          // Enforce business min/max order quantity for single-variant product.
          const rawProductMin =
            typeof product.minQuantity === "number"
              ? product.minQuantity
              : null;
          const rawProductMax =
            typeof product.maxQuantity === "number"
              ? product.maxQuantity
              : null;
          const minOrderQuantity =
            (rawProductMin != null && rawProductMin > 0 ? rawProductMin : 1) ??
            1;
          const maxOrderQuantity =
            rawProductMax != null && rawProductMax > 0 ? rawProductMax : null;

          if (
            item.quantity < minOrderQuantity ||
            (maxOrderQuantity != null && item.quantity > maxOrderQuantity)
          ) {
            throw new HTTPException(400, {
              message:
                maxOrderQuantity != null
                  ? `Quantity for "${product.name}" must be between ${minOrderQuantity} and ${maxOrderQuantity}`
                  : `Quantity for "${product.name}" must be at least ${minOrderQuantity}`,
            });
          }

          if (productStock < item.quantity) {
            throw new HTTPException(400, {
              message: `Insufficient stock for "${product.name}". Available: ${productStock}, Requested: ${item.quantity}`,
            });
          }

          unitPrice = roundTo2(product.sellingPrice ?? 0);
          if (unitPrice <= 0) {
            throw new HTTPException(400, {
              message: `Invalid price for "${product.name}"`,
            });
          }

          // Track stock update for product
          stockUpdates.push({
            productId: product._id,
            quantity: item.quantity,
          });
        } else {
          throw new HTTPException(400, {
            message: `"${product.name}" requires a variant to be selected`,
          });
        }

        // Calculate item-level discount (from product/variant)
        let discountAmount = 0;

        if (discountValue > 0) {
          discountValue = roundTo2(discountValue);
          if (discountType === DiscountType.PERCENTAGE) {
            discountAmount = (unitPrice * discountValue) / 100;
          } else {
            discountAmount = discountValue;
          }
        }

        discountAmount = roundTo2(discountAmount);

        const itemTotal = roundTo2(
          (unitPrice - discountAmount) * item.quantity,
        );
        subtotal += itemTotal;

        return {
          product: product._id,
          variantId,
          name: product.name,
          variantName,
          quantity: item.quantity,
          weight,
          weightUnit,
          unit,
          buyingPrice,
          unitPrice,
          discountType,
          discountValue,
          discountAmount: discountAmount * item.quantity,
          total: itemTotal,
        };
      }),
    );

    // Get latest config for default values
    const config = await getLatestConfig();
    const defaultCurrency = config?.currency || "BDT";
    const defaultTaxAmount = roundTo2(config?.taxAmount || 0);

    // Get shipping amount from selected shipping charge
    let selectedShippingCharge = null;
    if (shippingChargeName && config?.shippingCharges?.length) {
      selectedShippingCharge = config.shippingCharges.find(
        (charge) => charge.name === shippingChargeName,
      );
    }
    const defaultShippingAmount = selectedShippingCharge
      ? roundTo2(selectedShippingCharge.price || 0)
      : roundTo2(config?.shippingCharges?.[0]?.price || 0);
    // const defaultCodAmount = roundTo2(config?.codAmount ?? 0);

    // Validate and apply coupon
    let couponId = null;
    let couponDiscountAmount = 0;
    let shippingAmount = defaultShippingAmount;
    const isUserRole = user?.role === Role.USER;
    const invoiceType = isUserRole
      ? InvoiceType.ONLINE
      : type || InvoiceType.OFFLINE;
    const customerUserId = isUserRole
      ? user._id
      : customer.user
        ? new Types.ObjectId(customer.user)
        : undefined;

    if (couponCode) {
      try {
        const couponResponse = await getCouponByCodeService(
          couponCode,
          // @ts-ignore
          customerUserId ? { _id: customerUserId } : undefined,
          subtotal,
        );

        if (couponResponse.status !== 200) {
          throw new HTTPException(couponResponse.status, {
            message: couponResponse.message,
          });
        }

        const couponData = couponResponse.data as {
          isValid: boolean;
          coupon?: {
            _id: string;
            discountType: string;
            value: number;
            maxDiscount?: number;
            isFreeShipping?: boolean;
          };
        };

        if (!couponData.isValid || !couponData.coupon) {
          throw new HTTPException(400, { message: "Invalid coupon" });
        }

        couponId = couponData.coupon._id;
        const { discountType, value, maxDiscount, isFreeShipping } =
          couponData.coupon;

        // Calculate coupon discount
        // Handle both enum values and string values from database
        const couponDiscountType =
          discountType === DiscountType.PERCENTAGE ||
          discountType === "Percentage" ||
          discountType === "percentage"
            ? DiscountType.PERCENTAGE
            : DiscountType.FIXED;

        if (couponDiscountType === DiscountType.PERCENTAGE) {
          couponDiscountAmount = (subtotal * value) / 100;
          if (maxDiscount && couponDiscountAmount > maxDiscount) {
            couponDiscountAmount = maxDiscount;
          }
        } else {
          couponDiscountAmount = value;
        }
        couponDiscountAmount = roundTo2(couponDiscountAmount);

        // Apply free shipping if applicable
        if (isFreeShipping) {
          shippingAmount = 0;
        } else {
          // Use default shipping from config
          shippingAmount = defaultShippingAmount;
        }
      } catch (err) {
        if (err instanceof HTTPException) throw err;
        throw new HTTPException(400, { message: "Failed to validate coupon" });
      }
    }

    // Calculate tax from config
    const taxAmount = defaultTaxAmount;

    // Calculate total before COD, then COD fee and final total
    const totalBeforeCod = roundTo2(
      subtotal - couponDiscountAmount + shippingAmount + taxAmount,
    );
    // const codAmount = roundTo2(
    //   defaultCodAmount > 0 ? (totalBeforeCod * defaultCodAmount) / 100 : 0,
    // );
    const total = roundTo2(totalBeforeCod);
    // + codAmount);

    // Determine invoice type and customer user
    // If the authenticated user has role USER, it's an online invoice and use their ID
    // Otherwise, use the customer.user from payload (for admin/staff creating orders)

    // Generate invoice number
    const invoiceNumber = await generateIDBasedOnDate(
      "INV",
      Invoice,
      "invoiceNumber",
    );

    // Create invoice
    const invoice = await Invoice.create(
      [
        {
          invoiceNumber,
          type: invoiceType,
          customer: {
            ...customer,
            user: customerUserId,
          },
          items: lineItems,
          subtotal,
          coupon: couponId,
          // codAmount,
          couponDiscountAmount,
          shippingAmount,
          taxAmount,
          total,
          status: InvoiceStatus.PENDING,
          currency: defaultCurrency,
          notes,
          shippingAddress,
        },
      ],
      { session },
    );

    // Update coupon used count if coupon was applied
    if (couponId) {
      await Coupon.findByIdAndUpdate(
        couponId,
        { $inc: { usedCount: 1 } },
        { session },
      );
    }

    // Create initial transaction from payload (payment info at checkout)
    // const invoiceId = invoice[0]?._id;
    // if (invoiceId && transactionPayload) {
    //   if (total > 0) {
    //     await Transaction.create(
    //       [
    //         {
    //           invoice: invoiceId,
    //           amount: total,
    //           type: TransactionType.PAYMENT,
    //           status: TransactionStatus.PENDING,
    //           paymentMethod: transactionPayload.paymentMethod,
    //           reference: transactionPayload.reference,
    //         },
    //       ],
    //       { session },
    //     );
    //   }
    // }

    // Adjust stock levels
    for (const stockUpdate of stockUpdates) {
      if (stockUpdate.variantId) {
        // Update variant stock
        // Convert variantId to ObjectId for proper matching
        const variantObjectId =
          stockUpdate.variantId instanceof Types.ObjectId
            ? stockUpdate.variantId
            : new Types.ObjectId(String(stockUpdate.variantId));
        await Product.findOneAndUpdate(
          {
            _id: stockUpdate.productId,
            "variants._id": variantObjectId,
          },
          {
            $inc: { "variants.$.stock": -stockUpdate.quantity },
          },
          { session },
        );
      } else {
        // Update product stock
        await Product.findByIdAndUpdate(
          stockUpdate.productId,
          {
            $inc: { stock: -stockUpdate.quantity },
          },
          { session },
        );
      }
    }

    const createdInvoice = invoice[0]?.toObject();

    if (createdInvoice && paymentType === PaymentType.ONLINE) {
      console.log({
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASS,
      });

      const success_url =
        process.env.SERVER_URL +
        `/api/payments/success?invoiceNumber=${createdInvoice.invoiceNumber}`;
      const fail_url = process.env.SERVER_URL + "/api/payments/fail";
      const cancel_url = process.env.SERVER_URL + "/api/payments/cancel";
      const ipn_url = process.env.SERVER_URL + "/api/payments/ipn";
      const response = await sslcommerz.createPaymentSession({
        total_amount: createdInvoice.total,
        currency: createdInvoice.currency,
        tran_id: createdInvoice.invoiceNumber,
        success_url,
        fail_url,
        cancel_url,
        ipn_url,
        shipping_method: ShippingMethod.NO,
        product_name: createdInvoice.items.map((item) => item.name).join(", "),
        product_category: "Products",
        product_profile: ProductProfile.GENERAL,
        cus_name: createdInvoice.customer.name,
        cus_email: createdInvoice.customer.email || "",
        cus_phone: createdInvoice.customer.phone || "",
        value_a: createdInvoice.invoiceNumber,
        value_b: origin,
      });

      console.log({ response });

      if (response.status === "SUCCESS") {
        await session.commitTransaction();
        return {
          status: 201,
          message: "OK",
          timestamp: new Date().toISOString(),
          data: { redirectUrl: response.GatewayPageURL },
        };
      }
    }

    await session.commitTransaction();
    return {
      status: 201,
      message: "Invoice created",
      timestamp: new Date().toISOString(),
      data: { invoice: createdInvoice },
    };
  } catch (err) {
    console.log({ err });
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const getInvoiceByIdService = async (
  user: User | null | undefined,
  id: string,
): Promise<ResponseType> => {
  let invoice;
  const select: ProjectionType<Invoice> = {};
  if (user?.role === Role.USER) {
    select["items.buyingPrice"] = 0;
  }
  if (Types.ObjectId.isValid(id))
    invoice = await Invoice.findById(id, select)
      .populate("customer coupon")
      .lean();
  else
    invoice = await Invoice.findOne({ invoiceNumber: id }, select)
      .populate("customer coupon")
      .lean();

  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  // Calculate transaction totals using aggregation
  const invoiceId = invoice._id;
  const [paidResult, refundedResult, totalCount] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          invoice: invoiceId,
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
    Transaction.aggregate([
      {
        $match: {
          invoice: invoiceId,
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
    Transaction.countDocuments({ invoice: invoiceId }),
  ]);

  const paidAmount = paidResult[0]?.total || 0;
  const refundedAmount = refundedResult[0]?.total || 0;
  const paidCount = paidResult[0]?.count || 0;
  const refundedCount = refundedResult[0]?.count || 0;
  const remainingBalance = Math.max(
    0,
    invoice.total - paidAmount + refundedAmount,
  );
  const effectivePaid = paidAmount - refundedAmount;
  const isFullyPaid = remainingBalance <= 0;
  const paymentPercentage =
    invoice.total === 0
      ? 100
      : Math.min(100, Math.max(0, (effectivePaid / invoice.total) * 100));

  const transactionTotals = {
    paidAmount,
    refundedAmount,
    effectivePaid,
    remainingBalance,
    isFullyPaid,
    paymentPercentage,
    totalTransactions: totalCount,
    paidTransactions: paidCount,
    refundedTransactions: refundedCount,
  };

  const invoiceData = invoice;
  const responseData = {
    ...invoiceData,
    ...transactionTotals,
  };

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { invoice: responseData },
  };
};

export const listInvoicesService = async (
  user: User | null | undefined,
  query: ListInvoiceQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 24, cursor, status, search, type, userId, ...rest } = query;
  const filter: QueryFilter<Invoice> = { ...rest };
  if (cursor) filter._id = { $gt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (type?.length) filter.type = { $in: type };
  if (userId) filter["customer.user"] = userId;
  if (search)
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.email": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ];
  if (user?.role === Role.USER) filter["customer.user"] = user._id;

  const select: ProjectionType<Invoice> = {};
  if (user?.role === Role.USER) {
    select["items.sellingPrice"] = 0;
  }

  const items = await Invoice.find(filter, select, {
    sort: { _id: -1 },
    limit: limit + 1,
  }).lean();

  const hasMore = items.length > limit;
  const invoices = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && invoices.length > 0
      ? invoices?.[invoices.length - 1]?._id.toString()
      : undefined;

  // Calculate transaction totals for all invoices efficiently
  if (invoices.length > 0) {
    const invoiceIds = invoices.map((inv) => inv._id);

    // Aggregate paid amounts
    const paidAggregation = await Transaction.aggregate([
      {
        $match: {
          invoice: { $in: invoiceIds },
          status: TransactionStatus.SUCCESS,
          type: TransactionType.PAYMENT,
        },
      },
      {
        $group: {
          _id: "$invoice",
          paidAmount: { $sum: "$amount" },
          paidTransactions: { $sum: 1 },
        },
      },
    ]);

    // Aggregate refunded amounts
    const refundedAggregation = await Transaction.aggregate([
      {
        $match: {
          invoice: { $in: invoiceIds },
          status: TransactionStatus.SUCCESS,
          type: TransactionType.REFUND,
        },
      },
      {
        $group: {
          _id: "$invoice",
          refundedAmount: { $sum: "$amount" },
          refundedTransactions: { $sum: 1 },
        },
      },
    ]);

    // Count total transactions
    const totalTransactionsAggregation = await Transaction.aggregate([
      {
        $match: {
          invoice: { $in: invoiceIds },
        },
      },
      {
        $group: {
          _id: "$invoice",
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Create maps for quick lookup
    const paidMap = new Map(
      paidAggregation.map((item) => [
        item._id.toString(),
        {
          paidAmount: item.paidAmount,
          paidTransactions: item.paidTransactions,
        },
      ]),
    );
    const refundedMap = new Map(
      refundedAggregation.map((item) => [
        item._id.toString(),
        {
          refundedAmount: item.refundedAmount,
          refundedTransactions: item.refundedTransactions,
        },
      ]),
    );
    const totalTransactionsMap = new Map(
      totalTransactionsAggregation.map((item) => [
        item._id.toString(),
        item.totalTransactions,
      ]),
    );

    // Merge transaction data with invoices
    const invoicesWithTransactions = invoices.map((invoice) => {
      const invoiceId = invoice._id.toString();
      const paid = paidMap.get(invoiceId) || {
        paidAmount: 0,
        paidTransactions: 0,
      };
      const refunded = refundedMap.get(invoiceId) || {
        refundedAmount: 0,
        refundedTransactions: 0,
      };
      const totalTransactions = totalTransactionsMap.get(invoiceId) || 0;

      const remainingBalance = Math.max(
        0,
        invoice.total - paid.paidAmount + refunded.refundedAmount,
      );
      const effectivePaid = paid.paidAmount - refunded.refundedAmount;
      const isFullyPaid = remainingBalance <= 0;
      const paymentPercentage =
        invoice.total === 0
          ? 100
          : Math.min(100, Math.max(0, (effectivePaid / invoice.total) * 100));

      return {
        ...invoice,
        ...paid,
        ...refunded,
        effectivePaid,
        remainingBalance,
        isFullyPaid,
        paymentPercentage,
        totalTransactions,
      };
    });

    return {
      status: 200,
      message: "OK",
      timestamp: new Date().toISOString(),
      data: { invoices: invoicesWithTransactions || [] },
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    };
  }

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { invoices },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

const ALLOWED_UPDATE_FIELDS: (keyof UpdateInvoiceSchemaType)[] = [
  "invoiceNumber",
  "status",
  "notes",
  "shippingAddress",
];

function buildAllowedUpdate(
  json: UpdateInvoiceSchemaType,
): Partial<UpdateInvoiceSchemaType> {
  const update: Partial<UpdateInvoiceSchemaType> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (json[key] !== undefined) {
      (update as Record<string, unknown>)[key] = json[key];
    }
  }
  return update;
}

async function restoreStockForInvoice(
  items: Array<{
    product: string;
    variantId?: string | null;
    quantity: number;
  }>,
  session: mongoose.mongo.ClientSession,
): Promise<void> {
  for (const item of items) {
    const productId = new Types.ObjectId(item.product);
    if (item.variantId) {
      const variantObjectId = new Types.ObjectId(String(item.variantId));
      await Product.findOneAndUpdate(
        {
          _id: productId,
          "variants._id": variantObjectId,
        },
        { $inc: { "variants.$.stock": item.quantity } },
        { session },
      );
    } else {
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: item.quantity } },
        { session },
      );
    }
  }
}

export const updateInvoiceService = async (
  id: string,
  json: UpdateInvoiceSchemaType,
): Promise<ResponseType> => {
  const current = await Invoice.findById(id).lean();
  if (!current) throw new HTTPException(404, { message: "Invoice not found" });

  const updatePayload = buildAllowedUpdate(json);
  const newStatus = updatePayload.status ?? current.status;
  const isCancelledOrRefunded =
    newStatus === InvoiceStatus.CANCELLED ||
    newStatus === InvoiceStatus.REFUNDED;
  const wasAlreadyCancelledOrRefunded =
    current.status === InvoiceStatus.CANCELLED ||
    current.status === InvoiceStatus.REFUNDED;
  const shouldRestoreStock =
    isCancelledOrRefunded && !wasAlreadyCancelledOrRefunded;

  if (shouldRestoreStock) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const invoice = await Invoice.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, session },
      )
        .populate("customer coupon")
        .lean();
      if (!invoice)
        throw new HTTPException(404, { message: "Invoice not found" });
      await restoreStockForInvoice(
        invoice.items.map((item) => ({
          product: item.product?.toString(),
          variantId: item.variantId ? item.variantId?.toString() : null,
          quantity: item.quantity,
        })),
        session,
      );
      await session.commitTransaction();
      return {
        status: 200,
        message: "Invoice updated",
        timestamp: new Date().toISOString(),
        data: { invoice },
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  const invoice = await Invoice.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    { new: true },
  )
    .populate("customer coupon")
    .lean();
  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  return {
    status: 200,
    message: "Invoice updated",
    timestamp: new Date().toISOString(),
    data: { invoice },
  };
};

export const deleteInvoiceService = async (
  id: string,
): Promise<ResponseType> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new HTTPException(404, { message: "Invoice not found" });

  // B: Only allow delete when invoice is Cancelled or Refunded
  if (
    invoice.status !== InvoiceStatus.CANCELLED &&
    invoice.status !== InvoiceStatus.REFUNDED
  ) {
    throw new HTTPException(400, {
      message:
        "Cannot delete an invoice that is not cancelled or refunded. Cancel or refund the invoice first.",
    });
  }

  // C: Only allow delete when invoice has no transactions
  const transactionCount = await Transaction.countDocuments({ invoice: id });
  if (transactionCount > 0) {
    throw new HTTPException(400, {
      message:
        "Cannot delete an invoice that has transactions. Remove or settle transactions first.",
    });
  }

  await Invoice.findByIdAndDelete(id);

  return {
    status: 200,
    message: "Invoice deleted",
    timestamp: new Date().toISOString(),
  };
};
