import * as esbuild from "esbuild";
import { sortBy } from "@std/collections/sort-by";

import { loadConfig } from "./_deno-config.ts";

export const BASE_URL = "https://esm.sh"; // stable version url
export const NEXT_BASE_URL = "https://next.esm.sh"; // unstable next version url
/**
 esbuild plugin for rewriting deno's original import path to esm.sh URL
*/
export async function PathReplacePlugin(
  options: {
    denoConfigPath?: string;
    debug: boolean;
    baseUrl: string;
    developmentMode: boolean;
  } = {
    debug: false,
    baseUrl: BASE_URL,
    developmentMode: false,
  },
): Promise<esbuild.Plugin> {
  let baseUrl = options.baseUrl ?? BASE_URL;
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const debug = options.debug ? console.error : () => {};
  const config = await loadConfig(options.denoConfigPath, {
    debug,
    developmentMode: options.developmentMode,
  });

  return {
    name: "path-resolve-plugin",
    setup(build: esbuild.PluginBuild) {
      const suffix = options.developmentMode ? "?dev" : "";

      // alias -> path
      for (
        const [alias, { pkg, suffix }] of sortBy(
          Object.entries(config.specifiers ?? {}),
          ([k, _]) => -k.length,
        )
      ) {
        debug(`[DEBUG] setup resolve ${alias} -> ${baseUrl}/${pkg}`);
        const regexp = new RegExp(`^${alias}(/|$)`);
        build.onResolve(
          { filter: regexp },
          (args: esbuild.OnResolveArgs): esbuild.OnResolveResult | null => {
            const replaced = args.path.replace(
              regexp,
              baseUrl + "/" + pkg + "$1",
            ) + suffix;
            debug(`[DEBUG] rewrite ${args.path} -> ${replaced}`);
            return { path: replaced, external: true };
          },
        );
      }

      // jsr: -> https://esm.sh/jsr/
      debug(`[DEBUG] setup resolve jsr:*: -> ${baseUrl}/jsr/*`);
      build.onResolve(
        { filter: /^jsr:/ },
        (args: esbuild.OnResolveArgs): esbuild.OnResolveResult | null => {
          const replaced = args.path.replace(/^jsr:/, `${baseUrl}/jsr/`);
          debug(`[DEBUG] rewrite jsr: ${args.path} -> ${replaced}${suffix}`);
          return { external: true, path: replaced + suffix };
        },
      );

      // npm: -> https://esm.sh/
      debug(`[DEBUG] setup resolve npm:* -> ${baseUrl}/*`);
      build.onResolve(
        { filter: /^npm:/ },
        (args: esbuild.OnResolveArgs): esbuild.OnResolveResult | null => {
          const replaced = args.path.replace(/^npm:/, `${baseUrl}/`);
          debug(`[DEBUG] rewrite npm: ${args.path} -> ${replaced}${suffix}`);
          return { external: true, path: replaced + suffix };
        },
      );

      // // TODO: generate html importmap
      // build.onEnd(() => {
      // });
    },
  };
}

export type transpileOptions = {
  debug: boolean;
  denoConfigPath?: string;
  baseUrl?: string;
  plugins?: esbuild.Plugin[];
  developmentMode?: boolean;
};

/** Utility for transpiling .tsx code to .js (while forwarding external dependencies to esm.sh) */
export async function transpile(
  filename: string,
  options: transpileOptions,
): Promise<string> {
  let baseUrl = BASE_URL;
  if (options.baseUrl !== undefined) {
    baseUrl = options.baseUrl;
  }
  const developmentMode = options.developmentMode ?? false;

  let plugins = options.plugins;
  if (options.plugins === undefined) {
    plugins = [
      await PathReplacePlugin({ ...options, developmentMode, baseUrl }),
    ];
  }

  const b: esbuild.BuildResult = await esbuild.build({
    // inject, alias
    entryPoints: [filename],
    plugins: plugins,
    write: false,
    color: true,
    bundle: true, // need for resolve import
    logLevel: options.debug ? "debug" : "info",
    format: "esm",
  });
  if (b.outputFiles === undefined) {
    if (b.errors.length > 0) {
      throw new Error(b.errors[0].text);
    }
    throw new Error("no outputFiles");
  }
  return b.outputFiles[0].text;
}
