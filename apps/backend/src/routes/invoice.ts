import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import { roleGuard } from "@/middlewares/auth-guard";
import {
  createInvoiceSchema,
  listInvoiceQuerySchema,
  updateInvoiceSchema,
} from "@repo/common/schemas/invoice";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@repo/common/schemas/transaction";
import {
  createInvoiceService,
  getInvoiceByIdService,
  listInvoicesService,
  updateInvoiceService,
  deleteInvoiceService,
} from "@/services/invoice";
import {
  listTransactionsByInvoiceService,
  createTransactionService,
  updateTransactionService,
} from "@/services/transaction";
import { Role } from "@repo/common/enums/role";

const route = app.basePath("/api/invoices");

route.post(
  "/",
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  describeRoute({
    tags: ["Invoices"],
    summary: "Create invoice",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createInvoiceSchema),
  async (c) => {
    const user = c.get("user");
    const payload = c.req.valid("json");
    const origin = c.req.header("Origin");
    const host = c.req.header("Host");
    const response = await createInvoiceService(user, payload, {
      origin,
      host,
    });
    return c.json(response, response.status);
  },
);

route.get(
  "/",
  roleGuard({ allowedRoles: -1 }),
  describeRoute({
    tags: ["Invoices"],
    summary: "List invoices",
    responses: { 200: { description: "OK" } },
  }),
  validator("query", listInvoiceQuerySchema),
  async (c) => {
    const user = c.var.user;
    const query = c.req.valid("query");

    const response = await listInvoicesService(user, query);
    return c.json(response, response.status);
  },
);

route.get(
  "/:id/transactions",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Invoices"],
    summary: "List transactions for an invoice",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const response = await listTransactionsByInvoiceService(c.req.param("id"));
    return c.json(response, response.status);
  },
);

route.post(
  "/:id/transactions",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Invoices"],
    summary: "Create a payment or refund transaction for an invoice",
    responses: { 201: { description: "Created" } },
  }),
  validator("json", createTransactionSchema),
  async (c) => {
    const response = await createTransactionService(
      c.req.param("id"),
      c.req.valid("json"),
    );
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id/transactions/:transactionId",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Invoices"],
    summary: "Update a transaction (e.g. status)",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateTransactionSchema),
  async (c) => {
    const response = await updateTransactionService(
      c.req.param("id"),
      c.req.param("transactionId"),
      c.req.valid("json"),
    );
    return c.json(response, response.status);
  },
);

route.get(
  "/:id",
  describeRoute({
    tags: ["Invoices"],
    summary: "Get invoice by ID",
    responses: { 200: { description: "OK" } },
  }),
  roleGuard({ allowedRoles: -1, skipAuth: true }),
  async (c) => {
    const user = c.var.user;
    const id = c.req.param("id");
    const response = await getInvoiceByIdService(user, id);
    return c.json(response, response.status);
  },
);

route.patch(
  "/:id",
  roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
  describeRoute({
    tags: ["Invoices"],
    summary: "Update invoice",
    responses: { 200: { description: "OK" } },
  }),
  validator("json", updateInvoiceSchema),
  async (c) => {
    const response = await updateInvoiceService(
      c.req.param("id"),
      c.req.valid("json"),
    );
    return c.json(response, response.status);
  },
);

// route.delete(
//   "/:id",
//   roleGuard({ allowedRoles: [Role.SUPER_ADMIN, Role.ADMIN] }),
//   describeRoute({
//     tags: ["Invoices"],
//     summary: "Delete invoice",
//     responses: { 200: { description: "OK" } },
//   }),
//   async (c) => {
//     const response = await deleteInvoiceService(c.req.param("id"));
//     return c.json(response, response.status);
//   },
// );

export default route;
