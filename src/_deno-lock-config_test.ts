import { assertEquals } from "@std/assert/equals";

import { DependenciesScanner } from "./_deno-lock-config.ts";
import type { LockConfig } from "./_deno-lock-config.ts";

// table driven test
(() => {
  const msgPrefix = "DependenciesScanner.scan ";

  const config: LockConfig = {
    specifiers: {
      // jsr
      "jsr:@std/json@1": "1.0.1",
      "jsr:@std/jsonc@^1.0.1": "1.0.1",
      "jsr:@std/jsonc@*": "1.0.1",
      "jsr:@std/fs@^1.0.5": "1.0.8",
      "jsr:@std/path@^1.0.6": "1.0.8",
      "jsr:@std/path@^1.0.8": "1.0.8",
      // npm
      "npm:@types/react@18": "18.3.18",
      "npm:@types/react@19": "19.0.2",
      "npm:esbuild-wasm@0.24.2": "0.24.2",
      "npm:react-dom@18": "18.3.1_react@18.3.1",
      "npm:react-dom@19": "19.0.0_react@19.0.0",
      "npm:react-router@*": "7.1.1_react@18.3.1_react-dom@18.3.1__react@18.3.1",
      "npm:react-router@7": "7.1.1_react@18.3.1_react-dom@18.3.1__react@18.3.1",
      "npm:react@18": "18.3.1",
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
      "@std/fs@1.0.8": {
        "integrity":
          "161c721b6f9400b8100a851b6f4061431c538b204bb76c501d02c508995cffe0",
        "dependencies": [
          "jsr:@std/path@^1.0.8",
        ],
      },
      "@std/path@1.0.8": {
        "integrity":
          "548fa456bb6a04d3c1a1e7477986b6cffbce95102d0bb447c67c4ee70e0364be",
      },
    },
    npm: {
      "@types/cookie@0.6.0": {
        "integrity":
          "sha512-4Kh9a6B2bQciAhf7FSuMRRkUWecJgJu9nPnx3yzpsfXX/c50REIqpHY4C82bXP90qrLtXtkDxTZosYO3UpOwlA==",
      },
      "@types/prop-types@15.7.14": {
        "integrity":
          "sha512-gNMvNH49DJ7OJYv+KAKn0Xp45p8PLl6zo2YnvDIbTd4J6MER2BmWN49TG7n9LvkyihINxeKW8+3bfS2yDC9dzQ==",
      },
      "@types/react@18.3.18": {
        "integrity":
          "sha512-t4yC+vtgnkYjNSKlFx1jkAhH8LgTo2N/7Qvi83kdEaUtMDiwpbLAktKDaAMlRcJ5eSxZkH74eEGt1ky31d7kfQ==",
        "dependencies": [
          "@types/prop-types",
          "csstype",
        ],
      },
      "@types/react@19.0.2": {
        "integrity":
          "sha512-USU8ZI/xyKJwFTpjSVIrSeHBVAGagkHQKPNbxeWwql/vDmnTIBgx+TJnhFnj1NXgz8XfprU0egV2dROLGpsBEg==",
        "dependencies": [
          "csstype",
        ],
      },
      "cookie@1.0.2": {
        "integrity":
          "sha512-9Kr/j4O16ISv8zBBhJoi4bXOYNTkFLOqSL3UDB0njXxCXNezjeyVrJyGOWtgfs/q2km1gwBcfH8q1yEGoMYunA==",
      },
      "csstype@3.1.3": {
        "integrity":
          "sha512-M1uQkMl8rQK/szD0LNhtqxIPLpimGm8sOBwU7lLnCpSbTyY3yeU1Vc7l4KT5zT4s/yOxHH5O7tIuuLOCnLADRw==",
      },
      "esbuild-wasm@0.24.2": {
        "integrity":
          "sha512-03/7Z1gD+ohDnScFztvI4XddTAbKVmMEzCvvkBpQdWKEXJ+73dTyeNrmdxP1Q0zpDMFjzUJwtK4rLjqwiHbzkw==",
      },
      "js-tokens@4.0.0": {
        "integrity":
          "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      },
      "loose-envify@1.4.0": {
        "integrity":
          "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
        "dependencies": [
          "js-tokens",
        ],
      },
      "react-dom@18.3.1_react@18.3.1": {
        "integrity":
          "sha512-5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==",
        "dependencies": [
          "loose-envify",
          "react@18.3.1",
          "scheduler@0.23.2",
        ],
      },
      "react-dom@19.0.0_react@19.0.0": {
        "integrity":
          "sha512-4GV5sHFG0e/0AD4X+ySy6UJd3jVl1iNsNHdpad0qhABJ11twS3TTBnseqsKurKcsNqCEFeGL3uLpVChpIO3QfQ==",
        "dependencies": [
          "react@19.0.0",
          "scheduler@0.25.0",
        ],
      },
      "react-router@7.1.1_react@18.3.1_react-dom@18.3.1__react@18.3.1": {
        "integrity":
          "sha512-39sXJkftkKWRZ2oJtHhCxmoCrBCULr/HAH4IT5DHlgu/Q0FCPV0S4Lx+abjDTx/74xoZzNYDYbOZWlJjruyuDQ==",
        "dependencies": [
          "@types/cookie",
          "cookie",
          "react@18.3.1",
          "react-dom@18.3.1_react@18.3.1",
          "set-cookie-parser",
          "turbo-stream",
        ],
      },
      "react@18.3.1": {
        "integrity":
          "sha512-wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==",
        "dependencies": [
          "loose-envify",
        ],
      },
      "react@19.0.0": {
        "integrity":
          "sha512-V8AVnmPIICiWpGfm6GLzCR/W5FXLchHop40W4nXBmdlEceh16rCN8O8LNWm5bh5XUX91fh7KpA+W0TgMKmgTpQ==",
      },
      "scheduler@0.23.2": {
        "integrity":
          "sha512-UOShsPwz7NrMUqhR6t0hWjFduvOzbtv7toDH1/hIrfRNIDBnnBWd0CwJTGvTpngVlmwGCdP9/Zl/tVrDqcuYzQ==",
        "dependencies": [
          "loose-envify",
        ],
      },
      "scheduler@0.25.0": {
        "integrity":
          "sha512-xFVuu11jh+xcO7JOAGJNOXld8/TcEHK/4CituBUeUb5hqxJLj9YuemAEuvm9gQ/+pgXYfbQuqAkiYu+u7YEsNA==",
      },
      "set-cookie-parser@2.7.1": {
        "integrity":
          "sha512-IOc8uWeOZgnb3ptbCURJWNjWUPcO3ZnTTdzsurqERrP6nPyv+paC55vJM0LpOlT2ne+Ix+9+CRG1MNLlyZ4GjQ==",
      },
      "turbo-stream@2.4.0": {
        "integrity":
          "sha512-FHncC10WpBd2eOmGwpmQsWLDoK4cqsA/UT/GqNoaKOQnT8uzhtCbg3EoUDMvqpOSAI0S26mr0rkjzbOO6S3v1g==",
      },
    },
  };

  const s = DependenciesScanner.fromLockConfig(config, {
    ignoreTypesPackages: false,
  });
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
    {
      msg: "jsr no-version",
      pkg: "jsr:@std/jsonc@*",
      want: ["jsr/@std/json@1.0.1"],
    },
    {
      msg: "jsr semver",
      pkg: "jsr:@std/fs@^1.0.5",
      want: ["jsr/@std/path@1.0.8"],
    },
    {
      msg: "npm two",
      pkg: "npm:react@18",
      want: ["js-tokens@4.0.0", "loose-envify@1.4.0"],
    },
    {
      msg: "npm indirect deps", // react-dom@18 depends on react@18
      pkg: "npm:react-dom@18",
      want: [
        "js-tokens@4.0.0",
        "loose-envify@1.4.0",
        "react@18.3.1",
        "scheduler@0.23.2",
      ],
    },
    {
      msg: "npm another deps", // react-dom@18 and react-dom@19 has different deps
      pkg: "npm:react-dom@19",
      want: ["react@19.0.0", "scheduler@0.25.0"],
    },
    {
      msg: "npm complex-pinned-pkg",
      pkg: "npm:react-router@7",
      want: [
        "@types/cookie@0.6.0",
        "cookie@1.0.2",
        "js-tokens@4.0.0",
        "loose-envify@1.4.0",
        "react-dom@18.3.1",
        "react@18.3.1",
        "scheduler@0.23.2",
        "set-cookie-parser@2.7.1",
        "turbo-stream@2.4.0",
      ],
    },
  ];
  for (
    const { msg, pkg, want } of cases
  ) {
    Deno.test(msgPrefix + msg, () => {
      const got = s.scanDependencies(pkg);
      assertEquals(got, want);
    });
  }
})();
