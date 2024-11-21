default: 00 01 02
.PHONY: default

clean:
	rm -rf testdata/dst
.PHONY: clean

## output to stdout
00: testdata/src/hello.ts main.ts
	mkdir -p testdata/dst
	deno run -A main.ts $(filter-out main.ts,$^) > testdata/dst/hello.stdout.js
.PHONY: 00

## replace npm:preact -> https://esm.sh/preact, jsr:@std/collections -> https://esm.sh/jsr/@std/collections
01: testdata/src/cards-component.tsx main.ts
	mkdir -p testdata/dst
	deno run -A main.ts $(filter-out main.ts,$^) > testdata/dst/cards-component.stdout.js
.PHONY: 01

## output to directory with --outdir
02: testdata/src/hello.ts testdata/src/hello-component.tsx main.ts
	mkdir -p testdata/dst
	deno run -A main.ts $(filter-out main.ts,$^) --outdir testdata/dst
.PHONY: 02

