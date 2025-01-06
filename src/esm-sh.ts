import * as esbuild from "esbuild";
import * as jsonc from "@std/jsonc";
import { sortBy } from "@std/collections/sort-by";

import { DependenciesScanner } from "./_deno-lock-config.ts";
import type { LockConfig } from "./_deno-lock-config.ts";

export const BASE_URL = "https://esm.sh";

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

// deno.json
interface Config {
  imports: Record<string, string>;
  specifiers: Record<string, { pkg: string; suffix: string }>; // alias | path -> pkg + version + suffix
}

export async function loadConfig(
  denoConfigPath: string | undefined, // deno.json
  options: { debug: (_: string) => void; developmentMode: boolean },
): Promise<Config> {
  const debug = options.debug;

  let config: Config = { imports: {}, specifiers: {} }; // deno.json
  if (denoConfigPath) {
    debug(`[DEBUG] load deno.json from ${denoConfigPath}`);
    if (denoConfigPath.endsWith(".jsonc")) {
      const text = await Deno.readTextFile(denoConfigPath);
      config = JSON.parse(JSON.stringify(jsonc.parse(text)));
    } else {
      const text = await Deno.readTextFile(denoConfigPath);
      config = JSON.parse(text);
    }

    if (config.imports == undefined) {
      config.imports = {};
    }
    if (config.specifiers == undefined) {
      config.specifiers = {};
    }

    try {
      debug(`[DEBUG] load deno.lock from ${denoConfigPath}`);
      const lockConfig: LockConfig = JSON.parse(
        await Deno.readTextFile(
          denoConfigPath.replace("deno.json", "deno.lock"),
        ),
      );

      // https://esm.sh/#development-mode
      const globalSuffix = options.developmentMode ? ["dev"] : [];

      if (lockConfig.specifiers !== undefined) {
        // e.g. {"npm:react@18": version=18.3.1}

        const depScanner = DependenciesScanner.fromLockConfig(lockConfig);
        for (
          const [alias, specifier] of Object.entries(
            lockConfig.specifiers,
          )
        ) {
          let suffix: string[] = globalSuffix;
          const version = specifier.split("_")[0]; // TODO: handling deps

          const deps = depScanner.scanDependencies(alias);
          if (deps.length > 0) {
            suffix = suffix.concat(`deps=${deps.join(",")}`);
          }

          const parts = alias.split("@");
          const pkg = parts.slice(0, parts.length - 1).join("@");
          if (alias.startsWith("jsr:")) {
            config.specifiers[alias] = {
              pkg: `jsr/${pkg.substring(4)}@${version}`,
              suffix: suffix.length === 0 ? "" : "?" + suffix.join("&"),
            };
          } else if (alias.startsWith("npm:")) {
            config.specifiers[alias] = {
              pkg: `${pkg.substring(4)}@${version}`,
              suffix: suffix.length === 0 ? "" : "?" + suffix.join("&"),
            };
          } else {
            config.specifiers[alias] = {
              pkg: `${pkg}@${version}`,
              suffix: suffix.length === 0 ? "" : "?" + suffix.join("&"),
            };
          }
        }

        // e.g. {"@hono/hono": "jsr/@hono/hono@4.6.15"}
        for (const [alias, path] of Object.entries(config.imports)) {
          const specifier = config.specifiers[path];
          if (specifier) {
            config.specifiers[alias] = specifier;
            delete config.specifiers[path]; // simplify
          }
        }
      }
    } catch (e) {
      console.error(`[WARN] no deno.lock found: ${e}`);
    }
  }
  return config;
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
