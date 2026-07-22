/**
 * Jest stand-in for the vendored @pack/web-effects components. The real
 * builds touch browser-only APIs (matchMedia, canvas, MutationObserver) that
 * jsdom implements inconsistently across suites; tests only need the wrapped
 * content to render. The real components are exercised by the browser preview
 * and the SSR prerender build.
 */
import React from "react";

export const BorderBeam = React.forwardRef<
  HTMLDivElement,
  { children?: React.ReactNode } & Record<string, unknown>
>(function BorderBeamMock({ children }, ref) {
  return <div ref={ref}>{children}</div>;
});

export function ThinkingOrb(): null {
  return null;
}

export default BorderBeam;
