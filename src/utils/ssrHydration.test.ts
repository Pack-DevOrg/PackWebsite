import { shouldHydrateRoot } from "./ssrHydration";

describe("shouldHydrateRoot", () => {
  it("hydrates when prerendered markup matches the current pathname", () => {
    expect(
      shouldHydrateRoot({
        currentPathname: "/",
        hasExistingMarkup: true,
        prerenderedPath: "/",
      })
    ).toBe(true);

    expect(
      shouldHydrateRoot({
        currentPathname: "/features",
        hasExistingMarkup: true,
        prerenderedPath: "/features/",
      })
    ).toBe(true);
  });

  it("skips hydration when static fallback markup is for a different route", () => {
    expect(
      shouldHydrateRoot({
        currentPathname: "/app",
        hasExistingMarkup: true,
        prerenderedPath: "/",
      })
    ).toBe(false);

    expect(
      shouldHydrateRoot({
        currentPathname: "/auth/callback",
        hasExistingMarkup: true,
        prerenderedPath: "/",
      })
    ).toBe(false);
  });

  it("skips hydration when there is no route marker or no markup", () => {
    expect(
      shouldHydrateRoot({
        currentPathname: "/app",
        hasExistingMarkup: true,
        prerenderedPath: undefined,
      })
    ).toBe(false);

    expect(
      shouldHydrateRoot({
        currentPathname: "/",
        hasExistingMarkup: false,
        prerenderedPath: "/",
      })
    ).toBe(false);
  });
});
