import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import { dashboardQuerySchema } from "@/schemas/dashboard";
import { getDashboardStatsService } from "@/services/dashboard";
import { Role } from "@/enums/role";

const route = app.basePath("/api/dashboard");

route.get(
  "/stats",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Dashboard"],
    summary: "Get dashboard analytics",
    description:
      "Returns KPIs, revenue by day, orders by status, revenue by type, and payment method breakdown for the given period.",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", dashboardQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await getDashboardStatsService(query);
    return c.json(response, response.status);
  },
);

export default route;
