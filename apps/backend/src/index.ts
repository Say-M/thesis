import app from "./app";
import { describeRoute, resolver } from "hono-openapi";
import { responseSchema } from "@repo/common/schemas/response";
import authRoutes from "./routes/auth";
import assetRoutes from "./routes/asset";
import bannerRoutes from "./routes/banner";
import categoryRoutes from "./routes/category";
import configRoutes from "./routes/config";
import couponRoutes from "./routes/coupon";
import dashboardRoutes from "./routes/dashboard";
import invoiceRoutes from "./routes/invoice";
import pageRoutes from "./routes/page";
import productRoutes from "./routes/product";
import seoRoutes from "./routes/seo";
import userRoutes from "./routes/user";
import connectDB from "@repo/common/db/mongo";

await connectDB();

app.get(
  "/health",
  describeRoute({
    tags: ["Health"],
    summary: "Health check",
    description: "Check if the server is running",
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
              }),
            ),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(
      { status: 200, message: "OK", timestamp: new Date().toISOString() },
      200,
    );
  },
);

app.route("/", authRoutes);
app.route("/", assetRoutes);
app.route("/", bannerRoutes);
app.route("/", categoryRoutes);
app.route("/", configRoutes);
app.route("/", couponRoutes);
app.route("/", dashboardRoutes);
app.route("/", invoiceRoutes);
app.route("/", pageRoutes);
app.route("/", productRoutes);
app.route("/", seoRoutes);
app.route("/", userRoutes);

const port = process.env.PORT || 9000;

export default {
  port,
  fetch: app.fetch,
};
