import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createProductSchema,
  listProductQuerySchema,
  updateProductSchema,
} from "@repo/common/schemas/product";
import {
  createProductService,
  getProductByIdService,
  getProductBySlugService,
  listProductsService,
  updateProductService,
  deleteProductService,
} from "@/services/product";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/products");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Products"],
    summary: "Create product",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createProductSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const response = await createProductService(payload);
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  describeRoute({
    tags: ["Products"],
    summary: "List products",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listProductQuerySchema),
  async (c) => {
    const user = c.var.user;
    const query = c.req.valid("query");
    const response = await listProductsService(user, query);
    return c.json(response, response.status);
  },
);

route.get(
  "/slug/:slug",
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  describeRoute({
    tags: ["Products"],
    summary: "Get product by slug (public)",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const user = c.var.user;
    const slug = c.req.param("slug");
    const response = await getProductBySlugService(user, slug);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  describeRoute({
    tags: ["Products"],
    summary: "Get product by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const user = c.var.user;
    const id = c.req.param("id");
    const response = await getProductByIdService(user, id);
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Products"],
    summary: "Update product",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateProductSchema),
  async (c) => {
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const response = await updateProductService(id, payload);
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Products"],
    summary: "Delete product",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deleteProductService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
