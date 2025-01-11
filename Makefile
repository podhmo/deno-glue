default: 00 01 02 10 11
.PHONY: default

clean:
	rm -rf testdata/dst
.PHONY: clean

## output to stdout
00:
	mkdir -p testdata/dst
	deno run -A main.ts bundle testdata/src/hello.ts > testdata/dst/hello.stdout.js
.PHONY: 00

## replace npm:preact -> https://esm.sh/preact, jsr:@std/collections -> https://esm.sh/jsr/@std/collections
01:
	mkdir -p testdata/dst
	deno run -A main.ts bundle testdata/src/cards-component.tsx > testdata/dst/cards-component.stdout.js
.PHONY: 01

## output to directory with --outdir
02:
	mkdir -p testdata/dst
	deno run -A main.ts bundle testdata/src/hello.ts testdata/src/hello-component.tsx --outdir testdata/dst
.PHONY: 02

# scaffold examples
10:
	mkdir -p examples/react-example
	(cd examples/react-example && deno run -A ../../main.ts init -t react && echo {} > deno.json && deno cache *.tsx)
	deno run -A main.ts bundle examples/react-example/client.tsx --output-style html --next > examples/react-example/index.html
.PHONY: 10
11:
	mkdir -p examples/multi-index-example
	(cd examples/multi-index-example && deno run -A ../../main.ts init -t serve && echo '{"tasks": {"dev": "deno cache *.tsx && deno run -A main.ts --port 8080 --next"}}' > deno.json && deno cache *.tsx)
.PHONY: 10
