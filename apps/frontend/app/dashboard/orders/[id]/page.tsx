"use client";

import { useParams } from "next/navigation";
import OrderDetailPage from "./order-detail-page";
// import AddEditOrder from "./add-edit-order";

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const isCreate = orderId === "create";

  // if (isCreate) {
  //   return <AddEditOrder />;
  // }

  return <OrderDetailPage orderId={orderId} />;
}
