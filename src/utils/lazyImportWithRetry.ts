import React from "react";

export const lazyImportWithRetry = <TModule extends { default: React.ComponentType<any> }>(
  importer: () => Promise<TModule>,
  key: string
) =>
  React.lazy(async () => {
    const retryKey = `lazy-retry:${key}`;

    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(retryKey);
      }
      return module;
    } catch (error) {
      if (typeof window !== "undefined") {
        const hasRetried = window.sessionStorage.getItem(retryKey) === "1";
        if (!hasRetried) {
          window.sessionStorage.setItem(retryKey, "1");
          window.location.reload();
          await new Promise<never>(() => {
            // Intentionally unresolved while the page reloads.
          });
        }
        window.sessionStorage.removeItem(retryKey);
      }
      throw error;
    }
  });
