import { loadConfig } from "./esm-sh.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("loadConfig", async () => {
  const config = await loadConfig(
    "testdata/deno.json",
    { debug: (_: string) => {}, developmentMode: false },
  );

  const want = {
    "npm:@types/react@18": {
      pkg: "@types/react@18.3.18",
      suffix: "?deps=@types/prop-types@15.7.14,csstype@3.1.3",
    },
    "npm:preact@10.5.13": { pkg: "preact@10.5.13", suffix: "" },
    "npm:react-dom@18": {
      pkg: "react-dom@18.3.1",
      suffix:
        "?deps=js-tokens@4.0.0,loose-envify@1.4.0,react@18.3.1,scheduler@0.23.2",
    },
    "npm:react@18": {
      pkg: "react@18.3.1",
      suffix: "?deps=js-tokens@4.0.0,loose-envify@1.4.0",
    },
    "preact": { pkg: "preact@10.5.13", suffix: "" },
    "@hono/hono": { pkg: "jsr/@hono/hono@4.6.15", suffix: "" },
  };

  const got = config.specifiers;
  assertEquals(got, want);
});

Deno.test("loadConfig with development", async () => {
  const config = await loadConfig(
    "testdata/deno.json",
    { debug: (_: string) => {}, developmentMode: true },
  );

  const want = {
    "npm:@types/react@18": {
      pkg: "@types/react@18.3.18",
      suffix: "?dev&deps=@types/prop-types@15.7.14,csstype@3.1.3",
    },
    "npm:preact@10.5.13": { pkg: "preact@10.5.13", suffix: "?dev" },
    "npm:react-dom@18": {
      pkg: "react-dom@18.3.1",
      suffix:
        "?dev&deps=js-tokens@4.0.0,loose-envify@1.4.0,react@18.3.1,scheduler@0.23.2",
    },
    "npm:react@18": {
      pkg: "react@18.3.1",
      suffix: "?dev&deps=js-tokens@4.0.0,loose-envify@1.4.0",
    },
    "preact": { pkg: "preact@10.5.13", suffix: "?dev" },
    "@hono/hono": { pkg: "jsr/@hono/hono@4.6.15", suffix: "?dev" },
  };

  const got = config.specifiers;
  assertEquals(got, want);
});
