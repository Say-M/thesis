import { Hono } from "hono";
import { ensureDbConnected } from "../db/ensure";
import { requireAuth } from "../middleware/auth";
import { chatRoutes } from "./chat";
import { conversationRoutes } from "./conversations";
import { skinRoutes } from "./skin";

export const api = new Hono();

api.use("*", async (c, next) => {
  await ensureDbConnected();
  await next();
});

api.use("*", requireAuth());

api.route("/", chatRoutes);
api.route("/", conversationRoutes);
api.route("/", skinRoutes);

