import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createBlocklistSchema,
  listBlocklistQuerySchema,
} from "@repo/common/schemas/blocklist";
import {
  createBlocklistService,
  listBlocklistsService,
  deleteBlocklistService,
} from "@/services/blocklist";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/blocklist");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Blocklist"],
    summary: "Create blocklist",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createBlocklistSchema),
  async (c) => {
    const payload = c.req.valid("json");

    const response = await createBlocklistService(payload);
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Blocklist"],
    summary: "List blocklists",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listBlocklistQuerySchema),
  async (c) => {
    const query = c.req.valid("query");

    const response = await listBlocklistsService(query);
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Blocklist"],
    summary: "Delete blocklist",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const id = c.req.param("id");

    const response = await deleteBlocklistService(id);
    return c.json(response, response.status);
  },
);

export default route;
