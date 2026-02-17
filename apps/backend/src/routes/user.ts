import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import { listUserQuerySchema, updateUserSchema } from "@repo/common/schemas/user";
import {
  listUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "@/services/user";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/users");

route.get(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Users"],
    summary: "List users",
    description:
      "List users with optional search, status and role filters. For use in create order (customer selection).",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listUserQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listUsersService(query);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Users"],
    summary: "Get user by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getUserByIdService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Users"],
    summary: "Update user",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateUserSchema),
  async (c) => {
    const user = c.var.user;
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const response = await updateUserService(user, id, payload);
    return c.json(response, response.status);
  },
);

route.delete(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN] }),
  describeRoute({
    tags: ["Users"],
    summary: "Delete user",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const user = c.var.user;
    const id = c.req.param("id");
    const response = await deleteUserService(user, id);
    return c.json(response, response.status);
  },
);

export default route;
