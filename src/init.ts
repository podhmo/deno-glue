import { moreStrict, parseArgs } from "@podhmo/with-help";
const candidates = ["serve"] as const;

export async function main(
  args: string[] = Deno.args,
  baseOptions: { debug: boolean } = { debug: false },
) {
  const options_ = parseArgs(args, {
    name: "glue init",
    string: ["template"],
    required: ["template"],
    boolean: ["debug"],

    default: { template: "serve", debug: baseOptions.debug },
    flagDescription: {
      template: `init template, one of ${JSON.stringify(candidates)}`,
    },
  });

  const choices = moreStrict(options_).choices;
  const options = {
    ...options_,
    template: choices(options_.template, candidates),
  };

  if (options.debug) {
    console.error(`init with ${options.template}`);
  }
  switch (options.template) {
    case "serve": {
      await copyFile({
        from: "./examples/serve-command-example/client.tsx",
        to: "./client.tsx",
        debug: options.debug,
      });
      await copyFile({
        from: "./examples/serve-command-example/app.ts",
        to: "./app.ts",
        debug: options.debug,
      });
      break;
    }
    default: {
      const _: never = options.template;
      throw new Error(`unknown template ${options.template}`);
    }
  }
}

async function copyFile(options: { from: string; to: string; debug: boolean }) {
  let path = import.meta.resolve(options.from);
  if (options.debug) {
    console.error(`copy ${path} to ${options.to}`);
  }

  if (path.startsWith("file://")) {
    path = path.replace(/file:\/\//, ""); // FIXME: URI is not supported?
    await Deno.copyFile(path, options.to);
  } else if (path.startsWith("https://")) {
    const res = await fetch(path);
    const body = new Uint8Array(await res.arrayBuffer());
    await Deno.writeFile(options.to, body);
  } else {
    throw new Error(`unsupported path ${path}`);
  }
}

if (import.meta.main) {
  await main();
}
