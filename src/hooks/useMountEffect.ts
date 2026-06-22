import {useEffect} from "react";

/**
 * Mount-only escape hatch for external system setup/cleanup.
 * Prefer derived state, event handlers, and query abstractions everywhere else.
 */
export function useMountEffect(effect: () => void | (() => void)): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
