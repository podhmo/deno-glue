/** @jsxImportSource jsr:@hono/hono@4.6.14/jsx */
import { Context, Hono } from "jsr:@hono/hono@4.6.14";
import type { FC } from "jsr:@hono/hono@4.6.14/jsx";
import { raw } from "jsr:@hono/hono@4.6.14/utils/html";
import { transform } from "../../transform.ts";

// $ deno serve --port 8080 --allow-net --allow-read main.tsx
const app = new Hono();
app.get("/", async (ctx: Context) => {
  const clientSideCode = await transform({
    debug: true,
    filename: "./client.tsx",
    denoConfigPath: "./deno.json",
  });

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

const HTML: FC = ({ children }) => {
  return (
    <>
      {raw`<!DOCTYPE html>`}
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
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
