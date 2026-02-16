"use client";

import AddEditProduct from "./add-edit-product";
import { useParams } from "next/navigation";

export default function ProductAddOrEditPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "create");

  return <AddEditProduct id={id} />;
}
