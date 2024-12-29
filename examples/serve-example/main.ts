import { type Context, Hono } from "jsr:@hono/hono@4.6.15";
import { HTML, tsxToJs } from "../../mini-webapp.ts";
// $ deno run -A ../../serve.ts ./main.ts

const app = new Hono();
app.get("/", async (ctx: Context) => {
  const code = await tsxToJs({
    filename: "./client.tsx",
    debug: true,
    baseUrl: "/",
  });
  const html = HTML({ code, id: "app", title: "Counter" });
  return ctx.html(html);
});
export default app;
