import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";
import { resolve } from "@std/path";
import * as cache from "@denosaurs/cache";
import type { Context, Hono } from "@hono/hono";

// interface Module {
//   fetch: Deno.ServeHandler;
// }
type Module = Hono; // TODO: use standard interface

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
      const req = ctx.req;
      let url = new URL(req.path, "https://esm.sh").toString();
      const query = req.query();
      if (Object.keys(query).length > 0) {
        url += `?${new URLSearchParams(query).toString()}`; // todo: sorted query string is needed (for cache)
      }

      console.error("%cproxy request : %s", "color:gray", url);

      // confirm cache and download
      const ns = "podhmo-glue";
      const cached = await cache.cache(url, undefined, ns); // todo: passing policy
      const fileData = await Deno.readFile(cached.path);

      return new Response(fileData, {
        headers: cached.meta.headers,
        status: 200,
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

  serve(m.default, {
    hostname: "127.0.0.1",
    port: options.port,
    handler: m.fetch,
  });
}

if (import.meta.main) {
  main();
}
