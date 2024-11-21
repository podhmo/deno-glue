default: 00 01

## output to stdout
00: testdata/src/hello.ts main.ts
	mkdir -p testdata/dst
	deno run -A main.ts $(filter-out main.ts,$^) > testdata/dst/hello.stdout.js
.PHONY: 00

## output to directory
01: testdata/src/hello.ts testdata/src/hello-component.tsx main.ts
	mkdir -p testdata/dst
	deno run -A main.ts $(filter-out main.ts,$^) --outdir testdata/dst
.PHONY: 01

# 	 --dst testdata/dst \
#  testdata/src/hello.ts \
#  testdata/src/hello-component.tsx \


.PHONY: default

clean:
	rm -rf testdata/dst
.PHONY: clean