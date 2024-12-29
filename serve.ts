import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";
import * as cache from "./vendor/denosaurs/cache/mod.ts";
import type { Context, Hono } from "@hono/hono";
import { BASE_URL as ESM_SH_BASE_URL } from "./esm-sh.ts";
import { useCache as setupBaseUrlForTranspile } from "./mini-webapp.ts";

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

// esm-shが自分自身のパスを返すのでとりあえずすべてをproxyする
//
// e.g.
// /* esm.sh - react@18.3.1 */
// export * from "/stable/react@18.3.1/es2022/react.mjs";
// export { default } from "/stable/react@18.3.1/es2022/react.mjs";
export function setupCachedProxyEndpoint(app: Module, options: {
  hostname: string;
  port: number;
}) {
  app.get("/*", async (ctx: Context): Promise<Response> => {
    if (!ctx.req.url.startsWith("http")) {
      return new Response("invalid url", { status: 404 });
    }
    if (ctx.req.path === "/favicon.ico") {
      return new Response(null, { status: 404 });
    }

    const req = ctx.req;
    let url = new URL(req.path, ESM_SH_BASE_URL).toString();
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
        location = location.replace(ESM_SH_BASE_URL, "");
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

export function serve(
  app: Module,
  options: ServeOptions,
): Deno.HttpServer<Deno.NetAddr> {
  const hostname = options.hostname ?? "127.0.0.1";
  return Deno.serve({
    port: options.port,
    hostname,
    handler: app.fetch,
    signal: options.signal,
    onListen: options.onListen,
  });
}

export async function clearCache(): Promise<boolean> {
  console.error("clear cache: %s/%s", cache.directory(), ns);
  return await cache.purge(ns);
}

export async function main() {
  const name = "serve";
  const options_ = parseArgs(Deno.args, {
    name: name,
    usageText: `Usage: ${name} [options] <specifier>`,

    string: ["port"],
    required: ["port"],
    boolean: ["clear-cache", "cache"],
    negatable: ["cache"],
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
  let specifier: string = options._[0];
  if (!specifier.includes("://")) {
    specifier = `file://${Deno.realPathSync(specifier)}`; // to absolute path for restricted dynamic import in deno.
  }
  const m = await import(specifier);

  if (m.default === undefined) {
    console.error(
      "error: serve requires `export default { fetch } ` in the main module, did you forget it?",
    );
    Deno.exit(1);
  }

  if (options["clear-cache"]) {
    await clearCache();
  }

  const hostname = "127.0.0.1";

  // activate local cache
  if (options.cache) {
    setupBaseUrlForTranspile("/"); // request via local endpoint
    setupCachedProxyEndpoint(m.default, {
      hostname,
      port: options.port,
    });
  }

  serve(m.default, {
    hostname,
    port: options.port,
    handler: m.fetch,
  });
}

if (import.meta.main) {
  main();
}
