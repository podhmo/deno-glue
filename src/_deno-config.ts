import * as jsonc from "@std/jsonc";

import type { LockConfig } from "./_deno-lock-config.ts";
import { DependenciesScanner } from "./_deno-lock-config.ts";

// deno.json
interface Config {
  imports: Record<string, string>;
  specifiers: Record<string, { pkg: string; suffix: string }>; // alias | path -> pkg + version + suffix
}

// if true, applying some optimizations.
// - exclude @types/ dependencies
export const OPTIMIZE = true;

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

        const depScanner = DependenciesScanner.fromLockConfig(lockConfig, {
          ignoreTypesPackages: OPTIMIZE,
        });
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
