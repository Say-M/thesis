import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import { Role } from "@/enums/role";
import { updateConfigSchema } from "@/schemas/config";
import { getConfigService, updateConfigService } from "@/services/config";

const route = app.basePath("/api/config");

route.get(
  "/",
  describeRoute({
    tags: ["Config"],
    summary: "Get site config",
    description:
      "Returns the single config document. Creates one with defaults if none exists.",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getConfigService();
    return c.json(response, response.status);
  },
);

route.patch(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Config"],
    summary: "Update site config",
    description: "Updates the single config document (upsert).",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateConfigSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const response = await updateConfigService(payload);
    return c.json(response, response.status);
  },
);

export default route;
