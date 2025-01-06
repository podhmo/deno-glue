import { dirname, join as pathjoin } from "@std/path";
import { exists } from "@std/fs";

/** find config file like a DOM's Element.closest() */
export async function findClosestFile(
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
