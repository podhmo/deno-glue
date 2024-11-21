// testdata/src/hello-component.tsx
import { h } from "https://esm.sh/preact";
function hello(name) {
  return /* @__PURE__ */ h("p", null, "`Hello $", name, "`");
}
export {
  hello
};
