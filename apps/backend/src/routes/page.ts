import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  pageSchema,
  listPageQuerySchema,
  updatePageSchema,
} from "@repo/common/schemas/page";
import {
  createPageService,
  getPageByIdService,
  getPageBySlugService,
  listPagesService,
  updatePageService,
  deletePageService,
} from "@/services/page";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/pages");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Pages"],
    summary: "Create page",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", pageSchema),
  async (c) => {
    const response = await createPageService(c.req.valid("json"));
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  describeRoute({
    tags: ["Pages"],
    summary: "List pages",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listPageQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listPagesService(query);
    return c.json(response, response.status);
  },
);

route.get(
  "/slug/:slug",
  describeRoute({
    tags: ["Pages"],
    summary: "Get page by slug (public)",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getPageBySlugService(c.req.param("slug"));
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  describeRoute({
    tags: ["Pages"],
    summary: "Get page by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    const response = await getPageByIdService(id);
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Pages"],
    summary: "Update page",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updatePageSchema),
  async (c) => {
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const response = await updatePageService(id, payload);
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Pages"],
    summary: "Delete page",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deletePageService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
