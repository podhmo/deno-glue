default: 00 01 02 10
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

# init example
10:
	mkdir -p examples/react-example
	(cd examples/react-example && deno run -A ../../main.ts init && echo {} > deno.json && deno cache *.tsx)
.PHONY: 10
