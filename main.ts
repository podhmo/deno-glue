import { bundle } from "@deno/emit";
import { parseArgs } from "@podhmo/with-help";
import { join as pathjoin, dirname, basename } from "jsr:@std/path"
// deno run -A main.ts testdata/hello.ts

async function main(args: string[]) {
  const options = parseArgs(args, {
    name: "bundle",
    description: "bundle typescript file (deno/emit wrapper)",
    string: ["dst"],
    // string: ["config"], // TODO: loading tsconfig.json for something of jsxFactory option and so on.
  } as const);

  // TODO: concurrency
  for (const filename of options._) {
    const url = new URL(filename, import.meta.url);
    const result = await bundle(url, {});

    if (options.dst !== undefined) {
      // write to file
      const writename = pathjoin(options.dst, basename(filename).replace(/\.tsx?$/, ".js"));
      await Deno.mkdir(dirname(writename), { recursive: true });

      console.log(`write to ${writename}`);
      await Deno.writeTextFile(writename, result.code);
    } else {
      // write to stdout
      if (options._.length > 1) {
        console.log(`// ---- ${filename} ----`);
      }
      console.log(result.code);
    }
  }
}

if (import.meta.main) {
  await main(Deno.args);
}