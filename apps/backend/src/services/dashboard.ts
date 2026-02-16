import { Invoice } from "@/models/invoice";
import { Transaction } from "@/models/transaction";
import type { ResponseType } from "@repo/common/schemas/response";
import type { DashboardQuerySchemaType } from "@/schemas/dashboard";
import {
  InvoiceStatus,
  TransactionStatus,
  TransactionType,
} from "@/enums/invoice";

function getDateRange(period: "7d" | "30d") {
  const to = new Date();
  const days = period === "7d" ? 7 : 30;
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export const getDashboardStatsService = async (
  query: DashboardQuerySchemaType,
): Promise<ResponseType> => {
  const { period = "30d" } = query;
  const { from, to } = getDateRange(period);

  const [
    totalRevenueResult,
    totalOrdersResult,
    pendingOrdersResult,
    paidResult,
    refundedResult,
    revenueByDayResult,
    ordersByStatusResult,
    revenueByTypeResult,
    paymentMethodResult,
  ] = await Promise.all([
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments({
      status: { $nin: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED] },
      createdAt: { $gte: from, $lte: to },
    }),
    Invoice.countDocuments({
      status: InvoiceStatus.PENDING,
      createdAt: { $gte: from, $lte: to },
    }),
    Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.SUCCESS,
          type: TransactionType.PAYMENT,
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.SUCCESS,
          type: TransactionType.REFUND,
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          status: { $nin: [InvoiceStatus.CANCELLED, InvoiceStatus.REFUNDED] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$type",
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.SUCCESS,
          type: TransactionType.PAYMENT,
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = totalRevenueResult[0]?.total ?? 0;
  const totalOrders = totalOrdersResult ?? 0;
  const kpiOrders = (totalRevenueResult[0] as { count?: number } | undefined)
    ?.count ?? totalOrders;
  const pendingOrders = pendingOrdersResult ?? 0;
  const paidAmount = paidResult[0]?.total ?? 0;
  const refundedAmount = refundedResult[0]?.total ?? 0;

  const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
  const current = new Date(from);
  while (current <= to) {
    const d = current.toISOString().slice(0, 10);
    dayMap.set(d, { date: d, revenue: 0, orders: 0 });
    current.setDate(current.getDate() + 1);
  }
  for (const r of revenueByDayResult as {
    _id: string;
    revenue: number;
    orders: number;
  }[]) {
    const existing = dayMap.get(r._id);
    if (existing) {
      existing.revenue = r.revenue;
      existing.orders = r.orders;
    } else {
      dayMap.set(r._id, { date: r._id, revenue: r.revenue, orders: r.orders });
    }
  }
  const days = Array.from(dayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const ordersByStatus = (ordersByStatusResult as { _id: string; count: number; total: number }[]).map(
    (r) => ({ status: r._id, count: r.count, total: r.total }),
  );
  const revenueByType = (revenueByTypeResult as { _id: string; revenue: number; count: number }[]).map(
    (r) => ({ type: r._id, revenue: r.revenue, count: r.count }),
  );
  const paymentByMethod = (paymentMethodResult as { _id: string; amount: number; count: number }[]).map(
    (r) => ({ method: r._id, amount: r.amount, count: r.count }),
  );

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: {
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      kpis: {
        totalRevenue,
        totalOrders: kpiOrders,
        pendingOrders,
        paidAmount,
        refundedAmount,
        averageOrderValue: kpiOrders > 0 ? totalRevenue / kpiOrders : 0,
      },
      revenueByDay: days,
      ordersByStatus,
      revenueByType,
      paymentByMethod,
    },
  };
};
