import { Context, Hono } from "jsr:@hono/hono@4.6.14";
import { HTML, tsxToJs } from "../../mini-webapp.ts";
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
  const clientSideCode = await tsxToJs({
    debug: options.debug,
    filename: options.code,
    denoConfigPath: options["deno-config"],
  });

  const html = HTML({
    id: "root",
    code: clientSideCode,
    title: "counter example",
  });
  return ctx.html(html);
});

if (options.debug) {
  const clientSideCode = await tsxToJs({
    debug: true,
    filename: options.code,
    denoConfigPath: options["deno-config"],
  });
  console.error(clientSideCode);
}
Deno.serve(
  { hostname: "127.0.01", port: parseInt(options.port, 10) },
  app.fetch.bind(app),
);
