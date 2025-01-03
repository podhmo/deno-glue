// testdata/src/hello-component.tsx
import { jsxs } from "https://esm.sh/preact@10.5.13/jsx-runtime";
function hello(name) {
  return /* @__PURE__ */ jsxs("p", { children: [
    "Hello ",
    name
  ] });
}
export {
  hello
};
