# deno-glue

手軽にesm.shにオフロードしたbundleをする個人用の便利ツール

## examples

- [examples/react-example](https://github.com/podhmo/deno-glue/tree/main/examples/react-example)
- [examples/react-example2](https://github.com/podhmo/deno-glue/tree/main/examples/react-example2)

## CLI

bundle

```console
$ deno run -A jsr:@podhmo/glue bundle main.tsx
$ deno run -A jsr:@podhmo/glue bundle main.tsx --output-style html --html-id root
```

serve

```console
$ deno run -A jsr:@podhmo/glue serve --port 8080 app.ts
```

init

```console
# generate client.tsx and main.ts
$ deno run -A jsr:@podhmo/glue init
```