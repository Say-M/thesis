import app from "../app";
import { describeRoute, resolver, validator } from "hono-openapi";
import {
  loginSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "@/schemas/auth";
import {
  loginService,
  logoutService,
  registerService,
  profileUserService,
  heavyOperationService,
  publicService,
  updateProfileService,
  updatePasswordService,
} from "@/services/auth";
import { responseSchema } from "@repo/common/schemas/response";
import { roleGuard } from "@/middlewares/auth-guard";

const route = app.basePath("/api/auth");

route.post(
  "/login",
  describeRoute({
    tags: ["Auth"],
    summary: "Login",
    description: "Login to the system",
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: resolver(
              responseSchema.pick({
                status: true,
                message: true,
                timestamp: true,
                data: true,
              }),
            ),
          },
        },
      },
    },
  }),
  validator("json", loginSchema),
  async (c) => {
    const json = c.req.valid("json");
    const response = await loginService(c, json);
    return c.json(response, response.status);
  },
);

route.post(
  "/register",
  describeRoute({
    tags: ["Auth"],
    summary: "Register",
    description: "Register a new user",
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: resolver(
              responseSchema.pick({
                status: true,
                message: true,
                timestamp: true,
                data: true,
              }),
            ),
          },
        },
      },
    },
  }),
  validator("json", registerSchema),
  async (c) => {
    const json = c.req.valid("json");
    const response = await registerService(c, json);
    return c.json(response, response.status);
  },
);

route.get(
  "/profile",
  roleGuard({ allowedRoles: -1 }),
  describeRoute({
    tags: ["Auth"],
    summary: "Profile",
    description: "Profile the current user",
    responses: {
      200: {
        description: "OK",
      },
    },
  }),
  async (c) => {
    const response = await profileUserService(c);
    return c.json(response, response.status);
  },
);

route.patch(
  "/profile",
  roleGuard({ allowedRoles: -1 }),
  describeRoute({
    tags: ["Auth"],
    summary: "Update Profile",
    description: "Update the current user's profile",
  }),
  validator("json", updateProfileSchema),
  async (c) => {
    const user = c.var.user;
    const json = c.req.valid("json");
    const response = await updateProfileService(user, json);
    return c.json(response, response.status);
  },
);

route.patch(
  "/password",
  roleGuard({ allowedRoles: -1 }),
  describeRoute({
    tags: ["Auth"],
    summary: "Update Password",
    description: "Update the current user's password",
  }),
  validator("json", updatePasswordSchema),
  async (c) => {
    const user = c.var.user;
    const json = c.req.valid("json");
    const response = await updatePasswordService(user, json);
    return c.json(response, response.status);
  },
);

route.post(
  "/logout",
  describeRoute({
    tags: ["Auth"],
    summary: "Logout",
    description: "Logout from the system",
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: resolver(
              responseSchema.pick({
                status: true,
                message: true,
                timestamp: true,
                data: true,
              }),
            ),
          },
        },
      },
    },
  }),
  async (c) => {
    const response = await logoutService(c);
    return c.json(response, response.status);
  },
);

route.get(
  "/heavy-operation",
  describeRoute({
    tags: ["Test"],
    summary: "Heavy Operation",
    description: "Perform a heavy operation",
    responses: {
      200: {
        description: "OK",
      },
    },
  }),
  async (c) => {
    const response = await heavyOperationService(c);
    return c.json(response, response.status);
  },
);

route.get(
  "/public",
  describeRoute({
    tags: ["Test"],
    summary: "Public",
    description: "Public service",
  }),
  async (c) => {
    const response = await publicService(c);
    return c.json(response, response.status);
  },
);

export default route;
