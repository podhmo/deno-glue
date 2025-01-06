# serve example

`deno serve` like command

```console
$ deno run -A ../../main.ts serve --port 8080 app.ts
```

no cache

```console
$ deno run -A ../../main.ts serve --port 8080 --no-cache app.ts
```

with purge cache

```console
$ deno run -A ../../main.ts serve --port 8080 --clear-cache app.ts
```
