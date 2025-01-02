import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";

const commands = ["bundle", "serve"] as const;

export async function main() {
  const options = parseArgs(Deno.args, {
    name: "glue",
    usageText: "Usage: glue [options] <command>",
    boolean: ["debug"],
    default: {
      debug: false,
    },
    stopEarly: true, // for subcommand
    footer: [
      "",
      "Commands:",
      "  bundle <filename>  bundle file",
      "  serve              serve file",
    ].join("\n"),
  });
  if (options._.length === 0) {
    printHelp(options);
    console.error("command is required");
    Deno.exit(1);
  }

  const choices = moreStrict(options).choices;
  const subCommand = choices(options._[0], commands);

  const restArgs = options._.slice(1);

  switch (subCommand) {
    case "bundle": {
      const { main } = await import("./bundle.ts");
      await main(restArgs, options);
      break;
    }
    case "serve": {
      const { main } = await import("./serve.ts");
      await main(restArgs, options);
      break;
    }
    default: {
      const _: never = subCommand;
      console.error(`unknown command ${_}`);
    }
  }
}
if (import.meta.main) {
  await main();
}
