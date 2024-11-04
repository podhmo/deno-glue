default: clean
	deno run -A main.ts testdata/src/hello.ts --dst testdata/dst
.PHONY: default

clean:
	rm -rf testdata/dst
.PHONY: clean