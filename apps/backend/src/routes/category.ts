import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createCategorySchema,
  listCategoryQuerySchema,
  updateCategorySchema,
} from "@/schemas/category";
import {
  createCategoryService,
  getCategoryByIdService,
  listCategoriesService,
  updateCategoryService,
  deleteCategoryService,
} from "@/services/category";
import { Role } from "@/enums/role";

const route = app.basePath("/api/categories");

route.post(
  "/",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Categories"],
    summary: "Create category",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createCategorySchema),
  async (c) => {
    const payload = c.req.valid("json");
    const response = await createCategoryService(payload);
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  describeRoute({
    tags: ["Categories"],
    summary: "List categories",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listCategoryQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const response = await listCategoriesService(query);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  describeRoute({
    tags: ["Categories"],
    summary: "Get category by ID",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await getCategoryByIdService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Categories"],
    summary: "Update category",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateCategorySchema),
  async (c) => {
    const id = c.req.param("id");
    const payload = c.req.valid("json");
    const response = await updateCategoryService(id, payload);
    return c.json(response, response.status);
  },
);

// route.delete(
//   "/:id",
//   roleGuard({ allowedRoles: -1 }),
//   describeRoute({
//     tags: ["Categories"],
//     summary: "Delete category",
//     responses: { 200: { description: "OK" } },
//   }),
//   async (c) => {
//     const response = await deleteCategoryService(c.req.param("id"));
//     return c.json(response, response.status);
//   },
// );

export default route;
