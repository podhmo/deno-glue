import { type Context, Hono } from "jsr:@hono/hono@4.6.14";

import { transpile as tsxToJs } from "../../src/esm-sh.ts";
import { CODE, HTML } from "../../src/mini-webapp.ts";
import { parseArgs } from "jsr:@podhmo/with-help@0.5.3";

const options = parseArgs(Deno.args, {
  string: ["port", "code", "deno-config"],
  boolean: ["debug"],
  required: ["port", "code"],
  default: {
    port: "8080",
    code: "./client.tsx",
    "deno-config": "./deno.json",
  },
});

// $ deno run --allow-net --allow-read main.ts --port 8080
const app = new Hono();

app.get("/", async (ctx: Context) => {
  const clientSideCode = await tsxToJs(options.code, {
    debug: options.debug,
    denoConfigPath: options["deno-config"],
  });

  const html = HTML({
    title: "counter example",
  }, CODE({ id: "root", code: clientSideCode }));
  return ctx.html(html);
});

if (options.debug) {
  const clientSideCode = await tsxToJs(options.code, {
    debug: true,
    denoConfigPath: options["deno-config"],
  });
  console.error(clientSideCode);
}
Deno.serve(
  { hostname: "127.0.01", port: parseInt(options.port, 10) },
  app.fetch.bind(app),
);
