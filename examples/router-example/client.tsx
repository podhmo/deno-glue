/** @jsxRuntime automatic */
/** @jsxImportSource npm:react@19 */
/** @jsxImportSourceTypes npm:@types/react@19 */

import { StrictMode } from "npm:react@19";
import { createRoot } from "npm:react-dom@19/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "npm:@tanstack/react-router";
import { TanStackRouterDevtools } from "npm:@tanstack/router-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <header className="container">
        <hgroup>
          <h1>TanStack Router</h1>
          <h2>Example</h2>
        </hgroup>
        <nav>
          <ul>
            <li>
              <Link to="/" className="[&.active]:font-bold">
                Home
              </Link>
            </li>
            <li>
            <Link to="/about" className="[&.active]:font-bold">
              About
            </Link>
            </li>
          </ul>
        </nav>
      </header>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    return (
      <>
        <h1>Index</h1>
        <p>Welcome Home!</p>
      </>
    );
  },
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: function About() {
    return (
      <>
        <h1>About</h1>
        <p>about page <a href="https://github.com/podhmo/deno-glue/tree/main/examples/router-example" target="_blank">code</a></p>
      </>
    );
  },
});

// ----------------------------------------
// main
// ----------------------------------------
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
const router = createRouter({ routeTree });

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
