const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "") || "/";
};

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

  return (
    normalizePathname(prerenderedPath) === normalizePathname(currentPathname)
  );
};
