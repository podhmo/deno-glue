import { basename, join as pathjoin } from "@std/path"
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

if (import.meta.main) {
  await main();
}