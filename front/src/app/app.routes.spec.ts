import { describe, expect, it } from "vitest";
import { routes } from "./app.routes";

describe("routes", () => {
  it("redirects the root and unknown paths to login", () => {
    expect(routes[0]).toMatchObject({ path: '', pathMatch: 'full', redirectTo: 'login' });
    expect(routes.at(-1)).toEqual({ path: '**', redirectTo: 'login' });
  });

  it("protects the application shell and exposes dashboard and chat", () => {
    const shell = routes.find((route) => route.canActivate);

    expect(shell?.canActivate).toHaveLength(1);
    expect(shell?.children?.map((route) => route.path)).toEqual(['dashboard', 'chat']);
  });
});
