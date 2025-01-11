import { moreStrict, parseArgs } from "@podhmo/with-help";
const candidates = ["react", "preact"] as const;

export async function main(
  args: string[] = Deno.args,
  baseOptions: { debug: boolean } = { debug: false },
) {
  const options_ = parseArgs(args, {
    name: "glue init",
    string: ["template"],
    required: ["template"],
    boolean: ["debug"],

    default: { debug: baseOptions.debug },
    alias: { "t": "template" },
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
    case "react": {
      await copyFile({
        from: "./templates/components/react/main-counter.tsx",
        to: "./client.tsx",
        debug: options.debug,
      });
      await copyFile({
        from: "./templates/serve/app.ts",
        to: "./app.ts",
        debug: options.debug,
      });
      break;
    }
    case "preact": {
      await copyFile({
        from: "./templates/components/preact/main-counter.tsx",
        to: "./client.tsx",
        debug: options.debug,
      });
      await copyFile({
        from: "./templates/serve/app.ts",
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
