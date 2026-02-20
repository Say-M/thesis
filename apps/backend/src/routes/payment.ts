import { createTransactionService } from "@/services/transaction";
import app from "../app";
import { describeRoute, validator } from "hono-openapi";
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from "@repo/common/enums/invoice";

const route = app.basePath("/api/payments");

route.post(
  "/success",
  describeRoute({
    tags: ["Config"],
    summary: "Get site config",
    description:
      "Returns the single config document. Creates one with defaults if none exists.",
    responses: { 200: { description: "OK" } },
  }),
  async (c) => {
    const body = await c.req.parseBody();
    const currency_amount = body.currency_amount as string;
    const store_amount = body.store_amount as string;
    const invoiceNumber =
      c.req.query("invoiceNumber") || (body.value_a as string);
    const origin = body.value_b;
    const invoiceId = body.value_c as string;

    if (!invoiceNumber)
      return c.redirect(
        origin + "/payment/failed?message=Invoice number not found",
      );

    const response = await createTransactionService(
      invoiceId,
      {
        amount: Number(currency_amount),
        store_amount: Number(store_amount),
        type: TransactionType.PAYMENT,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethod.SSLCOMMERZ,
      },
      body,
    );

    return c.redirect(origin + "/invoices/" + invoiceNumber);
  },
);

route.post("/fail", async (c) => {
  const body = await c.req.parseBody();
  const invoiceNumber = body.value_a as string;
  const origin = body.value_b;

  return c.redirect(
    origin +
      encodeURI(
        "/payment/failed?message=Payment failed&invoiceNumber=" + invoiceNumber,
      ),
  );
});

route.post("/cancel", async (c) => {
  const body = await c.req.parseBody();
  const origin = body.value_b;
  return c.redirect(origin + "/products");
});

export default route;
