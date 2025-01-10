import * as cache from "../vendor/denosaurs/cache/mod.ts";
import type { Context, Hono } from "@hono/hono";

import { BASE_URL as ESM_SH_BASE_URL } from "./esm-sh.ts";
import * as miniweb from "./mini-webapp.ts";

// interface Module {
//   fetch: Deno.ServeHandler;
// }
export type Module = Hono; // TODO: use standard interface

const ns = "podhmo-glue"; // namespace for cache

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
    baseUrl?: string;
  },
): Deno.HttpServer<Deno.NetAddr> {
  const hostname = options.hostname;
  const port = options.port;
  const baseUrl = options.baseUrl ?? ESM_SH_BASE_URL;
  // activate local cache
  if (options.cache) {
    miniweb.useCache("/"); // request via local endpoint
    setupEsmShProxyEndpoint(app, { hostname, port, baseUrl });
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

// esm-shが自分自身のパスを返すのでとりあえずすべてをproxyする
//
// e.g.
// /* esm.sh - react@18.3.1 */
// export * from "/stable/react@18.3.1/es2022/react.mjs";
// export { default } from "/stable/react@18.3.1/es2022/react.mjs";
export function setupEsmShProxyEndpoint(app: Module, options: {
  hostname: string;
  port: number;
  baseUrl: string;
}) {
  const baseUrl = options.baseUrl;

  app.get("/*", async (ctx: Context): Promise<Response> => {
    if (!ctx.req.url.startsWith("http")) {
      return new Response("invalid url", { status: 404 });
    }
    if (ctx.req.path === "/favicon.ico") {
      return new Response(null, { status: 404 });
    }

    const req = ctx.req;
    let url = new URL(req.path, baseUrl).toString();
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
        location = location.replace(baseUrl, "");
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
