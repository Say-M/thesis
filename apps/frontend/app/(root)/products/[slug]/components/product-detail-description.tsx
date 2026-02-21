"use client";

import PlateEditor from "@/components/plugins/editor";
import type { Value } from "platejs";

export default function ProductDetailDescription({
  description,
}: {
  description: Value;
}) {
  return <PlateEditor value={description} readOnly />;
}
