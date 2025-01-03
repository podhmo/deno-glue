import { assertEquals } from "jsr:@std/assert/equals";

import { DependenciesScanner } from "./_deno-lock-config.ts";
import type { LockConfig } from "./_deno-lock-config.ts";

// table driven test
(() => {
  const msgPrefix = "DependenciesScanner.scan ";

  const config: LockConfig = {
    specifiers: {
      "jsr:@std/json@1": "1.0.1",
      "jsr:@std/jsonc@^1.0.1": "1.0.1",
    },
    jsr: {
      "@std/json@1.0.1": {
        "integrity":
          "1f0f70737e8827f9acca086282e903677bc1bb0c8ffcd1f21bca60039563049f",
      },
      "@std/jsonc@1.0.1": {
        "integrity":
          "6b36956e2a7cbb08ca5ad7fbec72e661e6217c202f348496ea88747636710dda",
        "dependencies": [
          "jsr:@std/json",
        ],
      },
    },
  };

  const s = DependenciesScanner.fromLockConfig(config);
  const cases: { msg: string; pkg: string; want: string[] }[] = [
    {
      msg: "jsr empty",
      pkg: "jsr:@std/json@1",
      want: [],
    },
    {
      msg: "jsr one",
      pkg: "jsr:@std/jsonc@^1.0.1",
      want: ["jsr/@std/json@1.0.1"],
    },
  ];
  for (
    const { msg, pkg, want } of cases
  ) {
    Deno.test(msgPrefix + msg, () => {
      const got = s.scan(pkg);
      assertEquals(got, want);
    });
  }
})();
