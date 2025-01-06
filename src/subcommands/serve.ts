import { dirname } from "@std/path/dirname";

import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";

import { clearCache, serve } from "../serve.ts";
import type { Module } from "../serve.ts";
import { findClosestFile } from "../utils.ts";

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
      const guessedPath = await findClosestFile(dirname(specifier), [
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
  const m = await import(specifier) as {
    default: Module;
  };

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
