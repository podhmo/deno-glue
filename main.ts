import { basename, dirname, join as pathjoin } from "@std/path";
import { exists } from "@std/fs";

import { buildUsage, parseArgs } from "@podhmo/with-help";

import * as esbuild from "npm:esbuild";
import { type BuildOptions } from "npm:esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import { PathReplacePlugin } from "./esbuild-plugin.ts";


async function main() {
  const args = parseArgs(Deno.args, {
    name: "mini-bundle",
    usageText: `${buildUsage({ name: "mini-bundle" })} <filename>...`,
    description: "外部の依存は可能な限りesm.shの方に任せる bundler",
    string: ["outdir", "deno-config"],
    boolean: ["debug"],
  });

  const pluginsCache = new Map<string | undefined, esbuild.Plugin[]>();

  // TODO: concurrency
  for (const inputFile of args._) {
    let denoConfigPath = args["deno-config"];
    if (denoConfigPath === undefined) {
      const guessedPath = await findClosestConfigFile(dirname(inputFile), [
        "deno.json",
        "deno.jsonc",
      ]);
      if (guessedPath !== null) {
        if (args.debug) {
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
          debug: args.debug,
        }),
        ...denoPlugins({
          loader: "native",
        }),
      ];
      pluginsCache.set(denoConfigPath, plugins);
    }

    const buildOptions: BuildOptions = {
      plugins: plugins,
      entryPoints: [inputFile],
      bundle: true,
      color: true,
      logLevel: args.debug ? "debug" : "info",
      format: "esm",
    };

    if (args.outdir !== undefined) {
      const outFile = pathjoin(
        args.outdir,
        basename(inputFile).replace(/\.tsx?$/, ".mjs"),
      );
      buildOptions.outfile = outFile;
    }

    await esbuild.build(buildOptions);
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
