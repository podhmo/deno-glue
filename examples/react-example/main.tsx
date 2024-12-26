/** @jsxImportSource jsr:@hono/hono@4.6.14/jsx */
import { Context, Hono } from "jsr:@hono/hono@4.6.14";
import { transform } from "../../transform.ts";

// $ deno serve --port 8080 --allow-net --allow-read main.tsx

const app = new Hono();
app.get("/", async (ctx: Context) => {
  // https://hono.dev/docs/guides/jsx#dangerouslysetinnerhtml

  const clientSideCode = await transform({
    debug: true,
    filename: "./client.tsx",
    denoConfigPath: "./deno.json",
  });

  const html = (
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
        <main id="root" class="container">
          <h1>...</h1>
        </main>
        <script
          type="module"
          dangerouslySetInnerHTML={{ __html: clientSideCode }}
        >
        </script>
      </body>
    </html>
  );
  // TODO: need !DOCTYPE
  return ctx.html(html);
});
export default app; // for deno serve
