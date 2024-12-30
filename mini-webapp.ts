import { transpile } from "./esm-sh.ts";
import { BASE_URL as ESM_SH_BASE_URL } from "./esm-sh.ts";
// https://www.npmjs.com/package/@picocss/pico
export const DEFAULT_CSS: string =
  `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`;

const options = {
  baseUrl: ESM_SH_BASE_URL,
  useCache: false,
  debug: true,
  developmentMode: false,
};

export function useCache(proxyUrl: string) {
  options.useCache = true;
  options.baseUrl = proxyUrl; // request via local endpoint
}

export function useDevelopmentMode() {
  options.developmentMode = true;
}

export function tsxToJs(filename: string): Promise<string> {
  return transpile({
    filename,
    debug: options.debug,
    baseUrl: options.baseUrl,
    developmentMode: options.developmentMode,
  });
}

export function HTML(
  props: {
    id: string;
    code: string;
    title?: string;
    css?: string;
    lang?: string; // e.g. "en" | "ja"
  },
): string {
  const id = props.id;
  const title = props.title ?? "--";
  const css = props.css ?? DEFAULT_CSS;
  const code = props.code;

  const html = [
    "<!DOCTYPE html>",
    props.lang
      ? `<html lang="${props.lang}" data-theme="dark">`
      : `<html data-theme="dark">`,
    "<head>",
    `<meta charset="utf-8" />`,
    `<title>${title}</title>`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<meta name="color-scheme" content="light dark" />`,
    css ? `<link rel="stylesheet" href="${css}" />` : null,
    "</head>",
    "<body>",
    `<main id=${id} class="container">`,
    "<h1>...</h1>",
    "</main>",
    `<script type="module">`,
    code,
    `</script>`,
    "</body>",
    "</html>",
  ];
  return html.filter((v) => v !== null).join("\n");
}
