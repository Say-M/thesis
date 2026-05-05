import { Hono } from "hono";
import { cors } from "hono/cors";
import { ensureDbConnected } from "./db/ensure";
import { api } from "./routes/api";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  }),
);

app.get("/healthz", async (c) => {
  try {
    await ensureDbConnected();
    return c.json({ ok: true });
  } catch (err) {
    return c.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown_error",
      },
      500,
    );
  }
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/api", api);

export default {
  port: 9000,
  fetch: app.fetch,
};
