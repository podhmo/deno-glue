/** @jsxRuntime automatic */
/** @jsxImportSource npm:preact@10 */
import { chunk } from "jsr:@std/collections@1.0.9";

export function CardsComponent(ns: number[], size: number) {
  return (
    <section class="cards">
      {chunk(ns, size).map((row, i) => (
        <div key={i} style={{ display: "flex" }}>
          {row.map((n) => <div key={n} style={{ padding: "1rem" }}>{n}</div>)}
        </div>
      ))}
    </section>
  );
}
