import { basename, dirname, join as pathjoin } from "@std/path";
import { exists } from "@std/fs";

import { buildUsage, moreStrict, parseArgs } from "@podhmo/with-help";

import * as esbuild from "esbuild";
import {
  BASE_URL as ESM_SH_BASE_URL,
  PathReplacePlugin,
  transpile,
} from "./esm-sh.ts";
import { HTML } from "./mini-webapp.ts";

const outputStyles = ["esm", "html"] as const;
const defaultOutputStyle = "esm";

async function main() {
  const options_ = parseArgs(Deno.args, {
    name: "mini-bundle",
    usageText: `${buildUsage({ name: "mini-bundle" })} <filename>...`,
    description: "外部の依存は可能な限りesm.shの方に任せる bundler",

    string: [
      "outdir",
      "deno-config",
      "esm-sh-base-url",
      "output-style",
      "html-id",
    ],
    boolean: ["debug"],
    required: ["esm-sh-base-url", "output-style", "html-id"],
    default: {
      "esm-sh-base-url": ESM_SH_BASE_URL,
      "output-style": defaultOutputStyle,
      "html-id": "root",
    },

    flagDescription: {
      outdir: "output directory",
      "deno-config": "deno.json or deno.jsonc",
      "output-style": `output style, one of ${
        JSON.stringify(outputStyles)
      } (default: ${defaultOutputStyle})`,
    },
  });

  const choices = moreStrict(options_).choices;
  const options = {
    ...options_,
    "output-style": choices(options_["output-style"], outputStyles),
  };

  const pluginsCache = new Map<string | undefined, esbuild.Plugin[]>();

  // TODO: concurrency
  for (const inputFile of options._) {
    let denoConfigPath = options["deno-config"];
    if (denoConfigPath === undefined) {
      const guessedPath = await findClosestConfigFile(dirname(inputFile), [
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

    let plugins = pluginsCache.get(denoConfigPath);
    if (plugins === undefined) {
      plugins = [
        await PathReplacePlugin({
          denoConfigPath,
          debug: options.debug,
          baseUrl: options["esm-sh-base-url"],
        }),
      ];
      pluginsCache.set(denoConfigPath, plugins);
    }

    switch (options["output-style"]) {
      case "esm": {
        const buildOptions: esbuild.BuildOptions = {
          plugins: plugins,
          entryPoints: [inputFile],
          bundle: true,
          color: true,
          logLevel: options.debug ? "debug" : "info",
          format: "esm",
          outdir: options.outdir,
          outExtension: {
            ".js": ".mjs",
          },
        };

        await esbuild.build(buildOptions);
        break;
      }
      case "html": {
        const code = await transpile({
          filename: inputFile,
          debug: options.debug,
          denoConfigPath: options["deno-config"],
          baseUrl: options["esm-sh-base-url"],
          plugins: plugins,
        });
        const html = HTML({
          id: options["html-id"],
          code,
          title: basename(inputFile),
        });

        if (options.outdir === undefined) {
          console.log(html);
        } else {
          const outPath = pathjoin(
            options.outdir,
            basename(inputFile),
            "index.html",
          );
          await Deno.writeTextFile(outPath, html);
        }
        break;
      }
      default: {
        const _: never = options["output-style"];
        throw new Error(`unknown output-style ${_}`);
      }
    }
  }

  await esbuild.stop();
}

async function findClosestConfigFile(
  startPath: string,
  targetFiles: string[],
): Promise<string | null> {
  let currentPath = await Deno.realPath(startPath);

  while (currentPath) {
    for (const file of targetFiles) {
      const filePath = pathjoin(currentPath, file);
      if (await exists(filePath)) {
        return filePath;
      }
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }

  return null;
}

if (import.meta.main) {
  await main();
}
