import type { Metadata } from "./file.ts";
import { CacheError } from "./cache.ts";
import { fromFileUrl } from "./deps.ts";

export async function exists(filePath: string | URL): Promise<boolean> {
  try {
    await Deno.lstat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

async function protocolFile(url: URL, dest: string): Promise<Metadata> {
  const path = fromFileUrl(url);
  try {
    if (!(await exists(path))) {
      throw new CacheError(`${path} does not exist on the local system.`);
    }
  } catch {
    throw new CacheError(`${path} is not valid.`);
  }
  await Deno.copyFile(path, dest);
  return {
    url: url.href,
  };
}

async function protocolHttp(url: URL, dest: string): Promise<Metadata> {
  const download = await fetch(url, {
    redirect: "manual",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    },
  });

  // error if not 200 or redirect
  if (
    !(download.status === 200 || download.status === 301 ||
      download.status === 302 || download.status === 303)
  ) {
    throw new CacheError(download.statusText);
  }
  const source = await download.arrayBuffer();
  await Deno.writeFile(dest, new Uint8Array(source));

  const headers: { [key: string]: string } = {};
  for (const [key, value] of download.headers) {
    headers[key] = value;
  }
  return {
    url: url.href,
    headers,
    status: download.status,
  };
}

export async function fetchFile(url: URL, dest: string): Promise<Metadata> {
  switch (url.protocol) {
    case "file:":
      return await protocolFile(url, dest);

    case "http:":
    case "https:":
      return await protocolHttp(url, dest);

    default:
      throw new CacheError(`unsupported protocol ("${url}")`);
  }
}
