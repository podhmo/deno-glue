import { basename, dirname, join as pathjoin } from "@std/path";
import { buildUsage, moreStrict, parseArgs } from "@podhmo/with-help";
import * as esbuild from "esbuild";

import {
  BASE_URL as ESM_SH_BASE_URL,
  PathReplacePlugin,
  transpile,
} from "../esm-sh.ts";
import { HTML } from "../mini-webapp.ts";
import { findClosestFile } from "../fileutils.ts";

const outputStyles = ["esm", "html"] as const;
const defaultOutputStyle = "esm";

export async function main(
  args: string[] = Deno.args,
  baseOptions: { debug: boolean } = { debug: false },
) {
  const options_ = parseArgs(args, {
    name: "glue bundle",
    usageText: `${buildUsage({ name: "mini-bundle" })} <filename>...`,
    description: "外部の依存は可能な限りesm.shの方に任せる bundler",

    string: [
      "outdir",
      "deno-config",
      "esm-sh-base-url",
      "output-style",
      "html-id",
    ],
    boolean: ["debug", "development"],
    required: ["esm-sh-base-url", "output-style", "html-id"],
    default: {
      "esm-sh-base-url": ESM_SH_BASE_URL,
      "output-style": defaultOutputStyle,
      "html-id": "root",
      "debug": baseOptions.debug,
    },

    flagDescription: {
      outdir: "output directory",
      "deno-config": "deno.json or deno.jsonc",
      "output-style": `output style, one of ${
        JSON.stringify(outputStyles)
      } (default: ${defaultOutputStyle})`,
      "development": "development mode for esm.sh",
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
      const guessedPath = await findClosestFile(dirname(inputFile), [
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
          developmentMode: options.development,
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
        const code = await transpile(inputFile, {
          debug: options.debug,
          denoConfigPath: options["deno-config"],
          baseUrl: options["esm-sh-base-url"],
          plugins: plugins,
          developmentMode: options.development,
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

if (import.meta.main) {
  await main();
}
