// testdata/src/cards-component.tsx
import { chunk } from "https://esm.sh/jsr/@std/collections@1.0.9";
import { h } from "https://esm.sh/preact@10.5.13";
function CardsComponent(ns, size) {
  return /* @__PURE__ */ h("section", { class: "cards" }, chunk(ns, size).map((row, i) => /* @__PURE__ */ h("div", { key: i, style: { display: "flex" } }, row.map((n) => /* @__PURE__ */ h("div", { key: n, style: { padding: "1rem" } }, n)))));
}
export {
  CardsComponent
};
