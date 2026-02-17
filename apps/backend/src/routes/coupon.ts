import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createCouponSchema,
  listCouponQuerySchema,
  getCouponByCodeBodySchema,
  updateCouponSchema,
} from "@repo/common/schemas/coupon";
import {
  createCouponService,
  getCouponByIdService,
  getCouponByCodeService,
  listCouponsService,
  updateCouponService,
  deleteCouponService,
} from "@/services/coupon";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/coupons");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Coupons"],
    summary: "Create coupon",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createCouponSchema),
  async (c) => {
    const response = await createCouponService(c.req.valid("json"));
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Coupons"],
    summary: "List coupons",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listCouponQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listCouponsService(query);
    return c.json(response, response.status);
  },
);

route.post(
  "/code/:code",
  describeRoute({
    tags: ["Coupons"],
    summary: "Apply coupon",
    responses: { 200: { description: "OK" } },
  }),
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  validator("json", getCouponByCodeBodySchema),
  async (c) => {
    const user = c.get("user");
    const cartTotal = c.req.valid("json").cartTotal;
    console.log({ ...c.req.valid("json") });

    const response = await getCouponByCodeService(
      c.req.param("code"),
      user,
      cartTotal,
    );
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Coupons"],
    summary: "Get coupon by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getCouponByIdService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Coupons"],
    summary: "Update coupon",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateCouponSchema),
  async (c) => {
    const response = await updateCouponService(
      c.req.param("id"),
      c.req.valid("json"),
    );
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Coupons"],
    summary: "Delete coupon",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deleteCouponService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
