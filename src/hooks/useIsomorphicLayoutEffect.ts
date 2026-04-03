import {useEffect, useLayoutEffect} from "react";

/**
 * Avoid SSR warnings for DOM-measurement effects while preserving
 * synchronous layout work in the browser after hydration.
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
