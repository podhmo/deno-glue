import { join as pathjoin } from "jsr:@std/path@1/join";

import { type Context, Hono } from "jsr:@hono/hono@4.6.16";
import { CODE, HTML, tsxToJs } from "jsr:@podhmo/glue@0.2.4/mini-webapp";

// serve for development
// $ deno run -A jsr:@podhmo/glue@0.2.4 serve --port 8080 ./app.ts
//
// bunle to single html file
// $ deno run -A jsr:@podhmo/glue@0.2.4 bundle --output-style html --html-id root ./client.tsx > index.html
//

const app = new Hono();
app.on("GET", ["/", "/about"], async (ctx: Context) => {
  const filename = Deno.env.get("TSX") || "client.tsx";
  const filepath = pathjoin(import.meta.dirname ?? "", filename);
  const title = Deno.env.get("TITLE") || "router-example";

  const code = await tsxToJs(filepath);
  const html = HTML({ title }, CODE({ id: "root", code }));
  return ctx.html(html);
});
export default app;
