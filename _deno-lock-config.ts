// deno.lock
export interface LockConfig {
  specifiers: Record<string, string>;
  jsr?: Record<string, { integrity: string; dependencies?: string[] }>;
  npm?: Record<string, { integrity: string; dependencies?: string[] }>;
  workspace?: { dependencies: string[] };
}

export class DependenciesScanner {
  deps: Record<string, string[]> = {};

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
    return new DependenciesScanner(mem, lockConfig.specifiers);
  }

  constructor(
    mem: Record<string, { esmpkg: string; dependencies: string[] }>,
    specifiers: Record<string, string>,
  ) {
    this.#mem = mem;
    this.#specifiers = specifiers;
  }

  // return dependencies
  scan(
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

    return this.#walk(key).slice(1); // the first element is itself, so remove it.
  }

  #walk(key: string): string[] {
    const cached = this.deps[key];
    if (cached !== undefined) {
      return cached;
    }

    const { esmpkg, dependencies } = this.#mem[key];
    const value: string[] = [esmpkg];
    for (const dep of dependencies) {
      const subvalue = this.#walk(dep);
      if (subvalue.length > 0) {
        value.push(...subvalue);
      }
    }

    this.deps[key] = value;
    return value; // duplicated elements are included
  }
}
