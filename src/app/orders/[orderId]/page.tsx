import { notFound } from "next/navigation";
import { mockOrders } from "@/data/mock-content";
import { OrderDetailClient } from "@/components/orders/order-detail-client";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params;
  const order = mockOrders.find(
    (o) => o.id.toLowerCase() === orderId.toLowerCase()
  );

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
