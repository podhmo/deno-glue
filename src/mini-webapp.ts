import { transpile } from "./esm-sh.ts";
import { BASE_URL as ESM_SH_BASE_URL } from "./esm-sh.ts";
import type { transpileOptions } from "./esm-sh.ts";

// https://www.npmjs.com/package/@picocss/pico
export const DEFAULT_CSS: string =
  `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`;

export const options: transpileOptions & { useCache: boolean } = {
  baseUrl: ESM_SH_BASE_URL,
  useCache: false,
  debug: false,
  developmentMode: false,
  denoConfigPath: undefined,
};

// helper functions for modify options

export function tsxToJs(
  filename: string,
): Promise<string> {
  return transpile(filename, options);
}

export function HTML(
  props: {
    title?: string;
    css?: string;
    lang?: string; // e.g. "en" | "ja"
  },
  children: string[],
): string {
  const title = props.title ?? "--";
  const css = props.css ?? DEFAULT_CSS;

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
    ...children,
    "</body>",
    "</html>",
  ];
  return html.filter((v) => v !== null).join("\n");
}

export function CODE(props: { id: string; code: string }): string[] {
  return [
    `<main id=${props.id} class="container">`,
    `<section>`,
    "<h1>...</h1>",
    `</section>`,
    "</main>",
    `<script type="module">`,
    props.code,
    `</script>`,
  ];
}

export function LINKS(
  props: {
    id?: string;
    title?: string;
    links: ({ href: string; text: string } | string)[];
  },
): string[] {
  const title = props.title ?? "Links";
  const items = props.links.map((v) =>
    typeof v === "string"
      ? `  <a role="button" class="secondary" href="${v}">${v}</a>`
      : `  <a role="button" class="secondary" href="${v.href}">${v.text}</a>`
  );

  return [
    `<main id=${props.id} class="container">`,
    `<section>`,
    `<h1>${title}</h1>`,
    ...(items.flatMap((v) => [`<p class="grid">`, v, `</p>`])),
    `</section>`,
    `</main>`,
  ];
}
