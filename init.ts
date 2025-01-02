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
        from: "./examples/serve-command-example/main.ts",
        to: "./main.ts",
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
  path = path.replace(/file:\/\//, ""); // FIXME: URI is not supported?

  if (options.debug) {
    console.error(`copy ${path} to ${options.to}`);
  }
  await Deno.copyFile(path, options.to);
}

if (import.meta.main) {
  await main();
}
