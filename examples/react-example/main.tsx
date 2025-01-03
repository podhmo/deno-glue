/** @jsxImportSource jsr:@hono/hono@4.6.14/jsx */
import { type Context, Hono } from "jsr:@hono/hono@4.6.14";
import type { FC } from "jsr:@hono/hono@4.6.14/jsx";
import { raw } from "jsr:@hono/hono@4.6.14/utils/html";
import { transpile } from "../../esm-sh.ts";

// $ deno serve --port 8080 --allow-net --allow-read main.tsx
const app = new Hono();
app.get("/", async (ctx: Context) => {
  const clientSideCode = await generateClientSideCode();
  // inject client side code  https://hono.dev/docs/guides/jsx#dangerouslysetinnerhtml
  const html = (
    <HTML>
      <>
        <main id="root" class="container">
          <h1>...</h1>
        </main>
        <script
          type="module"
          dangerouslySetInnerHTML={{ __html: clientSideCode }}
        >
        </script>
      </>
    </HTML>
  );
  return ctx.html(html);
});

async function generateClientSideCode(): Promise<string> {
  return await transpile("./client.tsx", {
    debug: true,
    denoConfigPath: "./deno.json",
  });
}

const HTML: FC = ({ children }) => {
  return (
    <>
      {raw`<!DOCTYPE html>`}
      <html lang="en" data-theme="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-schema" content="light dark"></meta>
          <title>counter example</title>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
          >
          </link>
        </head>

        <body>
          {children}
        </body>
      </html>
    </>
  );
};

export default app; // for deno serve

if (import.meta.main) {
  if (Deno.env.has("DEBUG")) {
    console.error(await generateClientSideCode());
  }
}
