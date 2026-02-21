import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import { processSteadfastInvoicesSchema } from "@repo/common/schemas/steadfast";
import {
  processSteadfastCallbackService,
  processSteadfastInvoicesService,
  SteadfastCallbackPayload,
  getSteadfastDeliveryStatusService,
} from "@/services/steadfast";
import { Role } from "@repo/common/enums/role";
import { HTTPException } from "hono/http-exception";

const route = app.basePath("/api/steadfast");

route.post(
  "/create_order",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Steadfast"],
    summary: "Process invoices from Steadfast",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", processSteadfastInvoicesSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const response = await processSteadfastInvoicesService(payload);
    return c.json(response, response.status);
  },
);

route.post("/callback", async (c) => {
  const authorization = c.req.header("Authorization");
  const [type, apiKey] = authorization?.split(" ") || [];
  if (type !== "Bearer" || apiKey !== process.env.STEADFAST_API_KEY) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const payload =
    (await c.req.parseBody()) as unknown as SteadfastCallbackPayload;

  const response = await processSteadfastCallbackService(payload);
  return c.json(response, response.status);
});

route.get("/delivery_status", async (c) => {
  const id = c.req.query("id");
  const invoice = c.req.query("invoice");
  const trackingCode = c.req.query("trackingCode");

  const response = await getSteadfastDeliveryStatusService(
    id,
    invoice,
    trackingCode,
  );
  return c.json(response, response.status);
});

export default route;
