import { useQuery } from "@tanstack/react-query";
import useApi from "../use-api";
import type { ResponseType } from "@repo/common/schemas/response";

const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export type DashboardKpis = {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  paidAmount: number;
  refundedAmount: number;
  averageOrderValue: number;
};

export type RevenueByDay = {
  date: string;
  revenue: number;
  orders: number;
};

export type OrdersByStatus = {
  status: string;
  count: number;
  total: number;
};

export type RevenueByType = {
  type: string;
  revenue: number;
  count: number;
};

export type PaymentByMethod = {
  method: string;
  amount: number;
  count: number;
};

export type DashboardStats = {
  period: string;
  from: string;
  to: string;
  kpis: DashboardKpis;
  revenueByDay: RevenueByDay[];
  ordersByStatus: OrdersByStatus[];
  revenueByType: RevenueByType[];
  paymentByMethod: PaymentByMethod[];
};

export type DashboardStatsResponse = Omit<ResponseType, "data"> & {
  data: DashboardStats;
};

export const useDashboardStats = (period: "7d" | "30d" = "30d") => {
  const api = useApi();
  return useQuery<DashboardStatsResponse>({
    queryKey: [...DASHBOARD_QUERY_KEY, period],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/stats?period=${period}`);
      return data;
    },
  });
};
