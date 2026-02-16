import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import { createOrUpdateSeoSchema } from "@/schemas/seo";
import {
  createOrUpdateSeoService,
  getSeoByTypeIdService,
  deleteSeoService,
} from "@/services/seo";
import { Role } from "@/enums/role";

const route = app.basePath("/api/seo");

route.patch(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Seo"],
    summary: "Create or Update SEO",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", createOrUpdateSeoSchema),
  async (c) => {
    const response = await createOrUpdateSeoService(c.req.valid("json"));
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  describeRoute({
    tags: ["Seo"],
    summary: "Get SEO by type and type's ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const type = c.req.query("type");
    const response = await getSeoByTypeIdService(c.req.param("id"), type);
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Seo"],
    summary: "Delete SEO",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deleteSeoService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
