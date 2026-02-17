import { z } from "zod";

export const dashboardQuerySchema = z.object({
  period: z.enum(["7d", "30d"]).default("30d"),
});

export type DashboardQuerySchemaType = z.infer<typeof dashboardQuerySchema>;
