import { moreStrict, parseArgs, printHelp } from "@podhmo/with-help";
import { resolve } from "@std/path";

interface Module {
  fetch: Deno.ServeHandler;
}

type ServeOptions = {
  port: number;
  hostname?: string;
  handler: Deno.ServeHandler;
  signal?: AbortSignal;
} & Deno.ServeOptions<Deno.NetAddr>;

export function serve(
  m: Module,
  options: ServeOptions,
): Deno.HttpServer<Deno.NetAddr> {
  const hostname = options.hostname ?? "127.0.0.1";
  // TODO: check if m is a Module
  return Deno.serve({
    port: options.port,
    hostname,
    handler: m.fetch,
    signal: options.signal,
    onListen: options.onListen,
  });
}

export async function main() {
  const name = "serve";
  const options_ = parseArgs(Deno.args, {
    name: name,
    usageText: `Usage: ${name} [options] <specifier>`,

    string: ["port"],
    required: ["port"],
    default: {
      port: "8080",
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

  // TODO: support tsx
  // TODO: type safe
  // https://docs.deno.com/deploy/api/dynamic-import/
  const specifier: string = options._[0];
  const resolved = resolve(specifier); // to absolute path for restricted dynamic import in deno.
  const m = await import(`file://${resolved}`);

  serve(m.default, {
    hostname: "127.0.0.1",
    port: options.port,
    handler: m.fetch,
  });
}

if (import.meta.main) {
  main();
}
