"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/api/dashboard";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  TrendingUp,
  CreditCard,
  RotateCcw,
} from "lucide-react";

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const ordersByStatusConfig: ChartConfig = {
  Pending: { label: "Pending", color: "var(--color-chart-1)" },
  Processing: { label: "Processing", color: "var(--color-chart-2)" },
  Shipped: { label: "Shipped", color: "var(--color-chart-3)" },
  Delivered: { label: "Delivered", color: "var(--color-chart-4)" },
  Cancelled: { label: "Cancelled", color: "var(--color-chart-5)" },
  Refunded: { label: "Refunded", color: "hsl(var(--destructive))" },
};

const revenueByTypeConfig: ChartConfig = {
  Online: { label: "Online", color: "var(--color-chart-1)" },
  Offline: { label: "Offline", color: "var(--color-chart-2)" },
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export default function DashboardPage() {
  const formatCurrency = useFormatCurrency();
  const [period, setPeriod] = useState<"7d" | "30d">("30d");
  const { data, isLoading } = useDashboardStats(period);
  const stats = data?.data;

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as "7d" | "30d")}
        >
          <TabsList>
            <TabsTrigger value="7d">Last 7 days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {formatCurrency(stats.kpis.totalRevenue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats.period === "7d" ? "Last 7 days" : "Last 30 days"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {stats.kpis.totalOrders}
                </div>
                <p className="text-muted-foreground text-xs">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {stats.kpis.pendingOrders}
                </div>
                <p className="text-muted-foreground text-xs">Awaiting</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Order Value
                </CardTitle>
                <TrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {formatCurrency(stats.kpis.averageOrderValue)}
                </div>
                <p className="text-muted-foreground text-xs">Per order</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CreditCard className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-green-600">
                  {formatCurrency(stats.kpis.paidAmount)}
                </div>
                <p className="text-muted-foreground text-xs">Payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                <RotateCcw className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-destructive">
                  {formatCurrency(stats.kpis.refundedAmount)}
                </div>
                <p className="text-muted-foreground text-xs">Refunds</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue over time</CardTitle>
                <CardDescription>Daily revenue and order count</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={revenueChartConfig}
                  className="min-h-[240px] w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={stats.revenueByDay.map((d) => ({
                      ...d,
                      dateShort: format(new Date(d.date), "MMM d"),
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="dateShort"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => `${v}`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-chart-1)"
                      fill="var(--color-chart-1)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by status</CardTitle>
                <CardDescription>Count per status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={ordersByStatusConfig}
                  className="min-h-[240px] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={stats.ordersByStatus}
                    layout="vertical"
                    margin={{ left: 0 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="status"
                      tickLine={false}
                      axisLine={false}
                      width={90}
                      tickFormatter={(v) =>
                        ordersByStatusConfig[v as keyof typeof ordersByStatusConfig]?.label ?? v
                      }
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelKey="status"
                          formatter={(value) => value}
                        />
                      }
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.ordersByStatus.map((entry, i) => (
                        <Cell
                          key={entry.status}
                          fill={
                            ordersByStatusConfig[
                              entry.status as keyof typeof ordersByStatusConfig
                            ]?.color ?? CHART_COLORS[i % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by type</CardTitle>
                <CardDescription>Online vs Offline</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={revenueByTypeConfig}
                  className="min-h-[240px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                    <Pie
                      data={stats.revenueByType}
                      dataKey="revenue"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {stats.revenueByType.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments by method</CardTitle>
                <CardDescription>Successful payment amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={Object.fromEntries(
                    stats.paymentByMethod.map((m, i) => [
                      m.method.replace(/\s+/g, "-"),
                      {
                        label: m.method,
                        color: CHART_COLORS[i % CHART_COLORS.length],
                      },
                    ])
                  )}
                  className="min-h-[240px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey="methodKey"
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="methodKey" />} />
                    <Pie
                      data={stats.paymentByMethod.map((m) => ({
                        ...m,
                        methodKey: m.method.replace(/\s+/g, "-"),
                      }))}
                      dataKey="amount"
                      nameKey="methodKey"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      strokeWidth={2}
                    >
                      {stats.paymentByMethod.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
