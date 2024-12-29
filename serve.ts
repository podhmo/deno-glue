import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";
import { resolve } from "@std/path";
import * as cache from "./vendor/denosaurs/cache/mod.ts";
import type { Context, Hono } from "@hono/hono";

// interface Module {
//   fetch: Deno.ServeHandler;
// }
type Module = Hono; // TODO: use standard interface

const ns = "podhmo-glue"; // namespace for cache

type ServeOptions = {
  port: number;
  hostname?: string;
  handler: Deno.ServeHandler;
  signal?: AbortSignal;
} & Deno.ServeOptions<Deno.NetAddr>;

export function serve(
  app: Module,
  options: ServeOptions,
): Deno.HttpServer<Deno.NetAddr> {
  // activate local cache

  {
    // esm-shが自分自身のパスを返すのでとりあえずすべてをproxyする
    //
    // e.g.
    // /* esm.sh - react@18.3.1 */
    // export * from "/stable/react@18.3.1/es2022/react.mjs";
    // export { default } from "/stable/react@18.3.1/es2022/react.mjs";

    app.get("/*", async (ctx: Context): Promise<Response> => {
      if (!ctx.req.url.startsWith("http")) {
        return new Response("invalid url", { status: 404 });
      }
      if (ctx.req.path === "/favicon.ico") {
        return new Response(null, { status: 404 });
      }

      const req = ctx.req;
      let url = new URL(req.path, "https://esm.sh").toString();
      const query = req.query();
      if (Object.keys(query).length > 0) {
        url += `?${new URLSearchParams(query).toString()}`; // todo: sorted query string is needed (for cache)
      }

      // TODO: confirm cache and download
      const data = await cache.cache(url, undefined, ns); // todo: passing policy
      const status = data.meta.status ?? 200;
      console.error("%cproxy request[%d]: %s", "color:gray", status, url);

      if (status === 301 || status === 302 || status === 303) {
        const headers = data.meta.headers ?? {};
        let location = headers["Location"] || headers["location"];
        if (location) {
          location = location.replace("https://esm.sh", "");
          console.error("%credirect: %s", "color:gray", location);
          return ctx.redirect(location, status);
        }
      }

      const fileData = await Deno.readFile(data.path);
      return new Response(fileData, {
        headers: {
          ...data.meta.headers,
          "Access-Control-Allow-Origin":
            `http://${options.hostname}:${options.port}`,
        },
        status: data.meta.status ?? 200,
      });
    });
  }

  const hostname = options.hostname ?? "127.0.0.1";
  // TODO: check if m is a Module
  return Deno.serve({
    port: options.port,
    hostname,
    handler: app.fetch,
    signal: options.signal,
    onListen: options.onListen,
  });
}

export async function main() {
  const name = "serve";
  const options_ = parseArgs(Deno.args, {
    name: name,
    usageText: `Usage: ${name} [options] <specifier>`,

    string: ["port"],
    required: ["port"],
    boolean: ["clear-cache"],
    default: {
      port: "8080",
    },
  });

  const restrict = moreStrict(options_);
  const options = {
    ...options_,
    port: restrict.integer(options_.port),
  };

  if (options_._.length < 1) {
    printHelp(options_);
    console.error("need export default { fetch: (Request) => Response }");
    Deno.exit(1);
  }

  // TODO: support tsx
  // TODO: type safe
  // https://docs.deno.com/deploy/api/dynamic-import/
  const specifier: string = options._[0];
  const resolved = resolve(specifier); // to absolute path for restricted dynamic import in deno.
  const m = await import(`file://${resolved}`);

  if (options["clear-cache"]) {
    console.error("clear cache: %s/%s", cache.directory(), ns);
    await cache.purge("podhmo-glue");
  }

  serve(m.default, {
    hostname: "127.0.0.1",
    port: options.port,
    handler: m.fetch,
  });
}

if (import.meta.main) {
  main();
}
