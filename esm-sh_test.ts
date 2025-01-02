import { loadConfig } from "./esm-sh.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("loadConfig", async () => {
  const config = await loadConfig(
    "testdata/deno.json",
    { debug: (_: string) => {} },
  );

  const want = {
    "@hono/hono": "jsr/@hono/hono@4.6.15",
    "npm:@types/react@18": "@types/react@18.3.18",
    "preact": "preact@10.5.13",
    "npm:preact@10.5.13": "preact@10.5.13",
    "npm:react-dom@18": "react-dom@18.3.1_react@18.3.1",
    "npm:react@18": "react@18.3.1",
  };

  const got = config.specifiers;
  assertEquals(got, want);
});
