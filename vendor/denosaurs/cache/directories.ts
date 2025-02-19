import { join, resolve } from "./deps.ts";

const POSIX_HOME = "HOME";

export function cachedir(): string {
  const env = Deno.env.get;
  const os = Deno.build.os;

  const deno = env("DENO_DIR");

  if (deno) return resolve(deno);

  let home: string | undefined;
  let path: string;
  switch (os) {
    case "aix":
    case "freebsd":
    case "illumos":
    case "netbsd":
    case "solaris":
    case "linux": {
      const xdg = env("XDG_CACHE_HOME");
      home = xdg ?? env(POSIX_HOME);
      path = xdg ? "deno" : join(".cache", "deno");
      break;
    }
    case "darwin":
      home = env(POSIX_HOME);
      path = join("Library", "Caches", "deno");
      break;

    case "windows":
      home = env("LOCALAPPDATA");
      home = home ?? env("USERPROFILE");
      path = "deno";
      break;
  }

  if (!home) return ".deno";
  return resolve(join(home, path!));
}

export function tmpdir(): string | undefined {
  const env = Deno.env.get;
  const os = Deno.build.os;

  const tmp = env("TMPDIR") ?? env("TEMP") ?? env("TMP");
  if (tmp) return resolve(tmp);

  switch (os) {
    case "linux":
    case "darwin":
    case "aix":
    case "freebsd":
    case "illumos":
    case "netbsd":
    case "solaris":
      return resolve("/tmp");
    case "windows":
      return resolve(
        join(env("HOMEDRIVE") ?? env("SYSTEMDRIVE") ?? "C:", "TEMP"),
      );
  }
}
