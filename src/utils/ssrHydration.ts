const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "") || "/";
};

const HYDRATABLE_PRERENDERED_PATHS = new Set(["/"]);

interface ShouldHydrateRootOptions {
  readonly currentPathname: string;
  readonly hasExistingMarkup: boolean;
  readonly prerenderedPath?: string | null;
}

export const shouldHydrateRoot = ({
  currentPathname,
  hasExistingMarkup,
  prerenderedPath,
}: ShouldHydrateRootOptions): boolean => {
  if (!hasExistingMarkup) {
    return false;
  }

  if (!prerenderedPath) {
    return false;
  }

  const normalizedPrerenderedPath = normalizePathname(prerenderedPath);
  const normalizedCurrentPath = normalizePathname(currentPathname);

  if (normalizedPrerenderedPath !== normalizedCurrentPath) {
    return false;
  }

  // The non-home marketing routes are prerendered for bots and first paint,
  // but their client trees currently diverge enough to trigger production
  // hydration recovery. Keep the HTML, then client-render those routes cleanly.
  return HYDRATABLE_PRERENDERED_PATHS.has(normalizedCurrentPath);
};
