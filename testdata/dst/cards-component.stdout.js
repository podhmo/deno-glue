// testdata/src/cards-component.tsx
import { chunk } from "https://esm.sh/jsr/@std/collections@1.0.9";
import { jsx } from "https://esm.sh/preact@10/jsx-runtime";
function CardsComponent(ns, size) {
  return /* @__PURE__ */ jsx("section", { class: "cards", children: chunk(ns, size).map((row, i) => /* @__PURE__ */ jsx("div", { style: { display: "flex" }, children: row.map((n) => /* @__PURE__ */ jsx("div", { style: { padding: "1rem" }, children: n }, n)) }, i)) });
}
export {
  CardsComponent
};
