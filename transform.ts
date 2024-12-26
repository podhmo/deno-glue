import * as esbuild from "esbuild";
import { PathReplacePlugin } from "./esbuild-plugin.ts";

export async function transform(
  options: {
    filename: string;
    debug: boolean;
    denoConfigPath?: string;
  },
): Promise<string> {
  const plugins: esbuild.Plugin[] = [
    await PathReplacePlugin(options),
  ];
  const b: esbuild.BuildResult = await esbuild.build({
    // inject, alias
    entryPoints: [options.filename],
    plugins: plugins,
    write: false,
    color: true,
    bundle: true, // need for resolve import
    logLevel: options.debug ? "debug" : "info",
    format: "esm",
  });
  if (b.outputFiles === undefined) {
    if (b.errors.length > 0) {
      throw new Error(b.errors[0].text);
    }
    throw new Error("no outputFiles");
  }
  return b.outputFiles[0].text;
}
