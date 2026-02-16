"use client";

import AddEditPage from "./add-edit-page";
import { useParams } from "next/navigation";

export default function PageAddOrEditPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "create";

  return <AddEditPage id={id} />;
}
