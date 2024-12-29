import { type Context, Hono } from "jsr:@hono/hono@4.6.15";

// $ deno run -A ../../serve.ts ./main.ts

const app = new Hono();
app.get("/", (ctx: Context) => {
  return ctx.html("<h1>hello world</h1>");
});
export default app;