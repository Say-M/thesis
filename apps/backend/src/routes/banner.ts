import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createBannerSchema,
  listBannerQuerySchema,
  updateBannerSchema,
} from "@repo/common/schemas/banner";
import {
  createBannerService,
  getBannerByIdService,
  listBannersService,
  updateBannerService,
  deleteBannerService,
} from "@/services/banner";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/banners");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Banners"],
    summary: "Create banner",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createBannerSchema),
  async (c) => {
    const response = await createBannerService(c.req.valid("json"));
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  describeRoute({
    tags: ["Banners"],
    summary: "List banners",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listBannerQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listBannersService(query);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  describeRoute({
    tags: ["Banners"],
    summary: "Get banner by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getBannerByIdService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Banners"],
    summary: "Update banner",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateBannerSchema),
  async (c) => {
    const response = await updateBannerService(
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
    tags: ["Banners"],
    summary: "Delete banner",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await deleteBannerService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

export default route;
