import { transpile } from "./esm-sh.ts";
export { transpile as tsxToJs };

// https://www.npmjs.com/package/@picocss/pico
export const DEFAULT_CSS: string =
  `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css`;

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
