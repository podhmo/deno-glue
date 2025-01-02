/** @jsxRuntime automatic */
/** @jsxImportSource npm:react@18 */
/** @jsxImportSourceTypes npm:@types/react@18 */

import { StrictMode, useState } from "npm:react@18";
import { createRoot } from "npm:react-dom@18/client";

// ----------------------------------------
// components
// ----------------------------------------
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
export default function App() {
  return (
    <main className="container">
      <h1>couter example</h1>
      <Counter />
    </main>
  );
}

// ----------------------------------------
// main
// ----------------------------------------
const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
