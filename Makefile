default: clean
	deno run -A main.ts --dst testdata/dst \
 testdata/src/hello.ts \
 testdata/src/hello-component.tsx \


.PHONY: default

clean:
	rm -rf testdata/dst
.PHONY: clean