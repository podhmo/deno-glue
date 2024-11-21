import { basename, dirname, join as pathjoin } from "@std/path"
import { exists } from "@std/fs";

import { buildUsage, parseArgs } from "@podhmo/with-help";

import * as esbuild from "npm:esbuild";
import { type BuildOptions } from "npm:esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";
import { PathReplacePlugin } from "./esbuild-plugin.ts";

// main
async function main() {
  const args = parseArgs(Deno.args, {
    name: "mini-bundle",
    usageText: `${buildUsage({ name: "mini-bundle" })} <filename>...`,
    description: "外部の依存は可能な限りesm.shの方に任せる bundler",
    string: ["outdir", "deno-config"],
    boolean: ["debug"],
  });


  // TODO: concurrency
  for (const inputFile of args._) {
    let configPath = args["deno-config"];
    if (configPath === undefined) {
      const guessedPath = await findClosestConfigFile(dirname(inputFile), ["deno.json"]);
      if(guessedPath !== null) {
        if(args.debug) {
          console.error(`[DEBUG] guessed deno.json is ${guessedPath}`);
        }
        configPath = guessedPath;
      }
    }

    const buildOptions: BuildOptions = {
      plugins: [PathReplacePlugin({ configPath: args["deno-config"], debug: args.debug }), ...denoPlugins({
        loader: "native",
      })],
      entryPoints: [inputFile],
      bundle: true,
      format: "esm",
    }
    if (args.outdir !== undefined) {
      const outFile = pathjoin(args.outdir, basename(inputFile).replace(/\.tsx?$/, ".mjs"));
      console.error(`[INFO] write to ${outFile}`);
      buildOptions.outfile = outFile;
    }

    await esbuild.build(buildOptions);
  }
  await esbuild.stop();
}

async function findClosestConfigFile(startPath: string, targetFiles: string[]): Promise<string | null> {
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