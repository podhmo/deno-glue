import { dirname, join as pathjoin } from "@std/path";
import { exists } from "@std/fs";

/** find config file like a DOM's Element.closest() */
export async function findClosestConfigFile(
  startPath: string,
  targetFiles: string[],
): Promise<string | null> {
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

// deno.lock
export interface LockConfig {
  version?: "4"; // we only support version 4

  specifiers: Record<string, string>;
  jsr?: Record<string, { integrity: string; dependencies?: string[] }>;
  npm?: Record<string, { integrity: string; dependencies?: string[] }>;
  workspace?: { dependencies: string[] };
}

export class DependenciesScanner {
  #cache: Record<string, string[]> = {};

  // layout:
  // {jsr:<jsr-package>@<version>: {dependencies: [...]}} +
  // {jsr:<jsr-package>: {dependencies: [...]}} +
  // {<npm-package>@<version>: {dependencies: [...]}} +
  // {<npm-package>: {dependencies: [...]}}
  #mem: Record<string, { esmpkg: string; dependencies: string[] }> = {};

  // e.g.
  // "npm:react-router@*": "7.1.1_react@18.3.1_react-dom@18.3.1__react@18.3.1"
  // "jsr:@std/json@1": "1.0.1"
  #specifiers: Record<string, string> = {};

  static fromLockConfig(lockConfig: LockConfig) {
    const mem: Record<string, { esmpkg: string; dependencies: string[] }> = {};
    const jsr = lockConfig.jsr;
    if (jsr !== undefined) {
      for (const [path, { dependencies }] of Object.entries(jsr)) {
        // e.g. @std/jsonc@1.0.1: {dependencies: ["jsr:@std/json"]}
        const parts = path.split("_")[0].split("@");
        const pkg = parts.slice(0, parts.length - 1).join("@");
        const version = parts[parts.length - 1];
        const value = {
          esmpkg: `jsr/${pkg}@${version}`,
          dependencies: dependencies ?? [],
        };

        mem["jsr:" + path] = value; // {jsr:<jsr-package>@<version>: {dependencies: [...]}}
        mem["jsr:" + pkg] = value; // {jsr:<jsr-package>: {dependencies: [...]}}
      }
    }

    const npm = lockConfig.npm;
    if (npm !== undefined) {
      for (const [path, { dependencies }] of Object.entries(npm)) {
        // e.g. react-router@7.1.1_react@18.3.1_react-dom@18.3.1__react@18.3.1:  [ "cookie", "react@18.3.1,"react-dom@18.3.1_react@18.3.1", ...]
        const parts = path.split("_")[0].split("@");
        const pkg = parts.slice(0, parts.length - 1).join("@");
        const version = parts[parts.length - 1];
        const value = {
          esmpkg: `${pkg}@${version}`,
          dependencies: dependencies ?? [],
        };

        mem[path] = value; // {<npm-package>@<version>: {dependencies: [...]}}
        mem[pkg] = value; // {<npm-package>: {dependencies: [...]}}
      }
    }

    // semver alias
    for (const [alias, version] of Object.entries(lockConfig.specifiers)) {
      const parts = alias.split("@");
      let pkg = parts.slice(0, parts.length - 1).join("@");
      if (pkg.startsWith("npm:")) {
        pkg = pkg.substring(4); // trim npm: for depenencies layout
      }

      mem[alias] = mem[pkg + "@" + version];

      if (alias.endsWith("@*")) {
        mem[pkg] = mem[pkg + "@" + version]; // if no version, use specified version (overwrite jsr and npm phase)
      }
    }
    return new DependenciesScanner(mem, lockConfig.specifiers);
  }

  constructor(
    mem: Record<string, { esmpkg: string; dependencies: string[] }>,
    specifiers: Record<string, string>,
  ) {
    this.#mem = mem;
    this.#specifiers = specifiers;
  }

  scanDependencies(
    pkg: string, // the key of #specifiers (for example "npm:react-router@*", "jsr:@std/json@1", ...)
  ): string[] {
    const version = this.#specifiers[pkg];
    if (version === undefined) {
      return [];
    }

    const parts = pkg.split("@");
    const prefix = parts.slice(0, parts.length - 1).join("@");
    let key = prefix + "@" + version;
    if (key.startsWith("npm:")) {
      key = key.substring(4); // trim npm: for depenencies layout
    }

    const walked = this.#walk(key, [key]);

    // the first element is itself, so remove it.
    let deps = walked.slice(1);
    if (deps.length <= 1) {
      return deps;
    }
    deps = Array.from(new Set(walked.slice(1)));
    deps.sort();
    return deps;
  }

  #walk(key: string, history: string[]): string[] {
    const cached = this.#cache[key];
    if (cached !== undefined) {
      return cached;
    }

    const { esmpkg, dependencies } = this.#mem[key];
    const value: string[] = [esmpkg];
    for (const dep of dependencies) {
      history.push(dep);
      const subvalue = this.#walk(dep, history);
      history.pop();
      if (subvalue.length > 0) {
        value.push(...subvalue);
      }
    }

    this.#cache[key] = value;
    return value; // duplicated elements are included
  }
}
