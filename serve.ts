import { dirname } from "@std/path/dirname";

import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";
import * as cache from "./vendor/denosaurs/cache/mod.ts";
import type { Context, Hono } from "@hono/hono";

import { BASE_URL as ESM_SH_BASE_URL } from "./esm-sh.ts";
import * as miniweb from "./mini-webapp.ts";
import { findClosestConfigFile } from "./_deno-lock-config.ts";

// interface Module {
//   fetch: Deno.ServeHandler;
// }
type Module = Hono; // TODO: use standard interface

const ns = "podhmo-glue"; // namespace for cache

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
  options: Deno.ServeOptions<Deno.NetAddr> & {
    port: number;
    hostname: string;
    signal?: AbortSignal;

    cache: boolean;
    debug: boolean;
    development: boolean;
    denoConfigPath?: string;
  },
): Deno.HttpServer<Deno.NetAddr> {
  const hostname = options.hostname;
  const port = options.port;

  // activate local cache
  if (options.cache) {
    miniweb.useCache("/"); // request via local endpoint
    setupCachedProxyEndpoint(app, {
      hostname,
      port,
    });
  }

  if (options.development) {
    miniweb.useDevelopmentMode();
  }
  if (options.denoConfigPath !== undefined) {
    miniweb.useDenoConfig(options.denoConfigPath);
  }
  if (options.debug) {
    miniweb.useDebug();
  }

  return Deno.serve({
    port,
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

export async function main(
  args: string[] = Deno.args,
  baseOptions: { debug: boolean } = { debug: false },
) {
  const name = "glue serve";
  const options_ = parseArgs(args, {
    name: name,
    usageText: `Usage: ${name} [options] <specifier>`,

    string: ["port", "host", "deno-config"],
    required: ["port", "host"],
    boolean: ["clear-cache", "cache", "development", "debug"],
    negatable: ["cache"],
    default: {
      host: "127.0.0.1",
      port: "8080",
      debug: baseOptions.debug,
    },
    flagDescription: {
      "development": "development mode for esm.sh",
      "deno-config": "deno.json or deno.jsonc",
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

  let denoConfigPath = options["deno-config"];

  let specifier: string = options._[0];
  if (!specifier.includes("://")) {
    if (denoConfigPath === undefined) {
      const guessedPath = await findClosestConfigFile(dirname(specifier), [
        "deno.json",
        "deno.jsonc",
      ]);
      if (guessedPath !== null) {
        if (options.debug) {
          console.error(`[DEBUG] guessed deno.json is ${guessedPath}`);
        }
        denoConfigPath = guessedPath;
      }
    }

    // to uri
    specifier = `file://${Deno.realPathSync(specifier)}`; // to absolute path for restricted dynamic import in deno.
  }

  // TODO: support tsx
  // TODO: type safe
  // https://docs.deno.com/deploy/api/dynamic-import/
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

  const server = serve(m.default, {
    hostname: options.host,
    port: options.port,

    // transpile options ...
    debug: options.debug,
    cache: options.cache,
    development: options.development,
    denoConfigPath: denoConfigPath,
  });
  server.finished.then(() => {
    console.error("server finished");
  });
}

if (import.meta.main) {
  main();
}
