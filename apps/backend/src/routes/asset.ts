import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createAssetSchema,
  createBulkAssetSchema,
  listAssetQuerySchema,
} from "@/schemas/asset";
import {
  createAssetService,
  getAssetByIdService,
  listAssetsService,
  deleteAssetService,
  createBulkAssetsService,
} from "@/services/asset";
import { Role } from "@/enums/role";

const route = app.basePath("/api/assets");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Assets"],
    summary: "Create asset",
    responses: { 201: { description: "Created" } },
  }),
  validator("form", createAssetSchema),
  async (c) => {
    const user = c.var.user!;
    const payload = c.req.valid("form");
    const response = await createAssetService(user, payload);
    return c.json(response, response.status);
  },
);

route.post(
  "/bulk",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Assets"],
    summary: "Create bulk assets",
    responses: { 201: { description: "Created" } },
  }),
  validator("form", createBulkAssetSchema),
  async (c) => {
    const user = c.var.user!;
    const payload = c.req.valid("form");
    const response = await createBulkAssetsService(user, payload);
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Assets"],
    summary: "List assets",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listAssetQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listAssetsService(query);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Assets"],
    summary: "Get asset by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getAssetByIdService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Assets"],
    summary: "Delete asset",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deleteAssetService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
