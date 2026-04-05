import React, { Suspense } from "react";
import { AuthProvider } from "@/auth/AuthContext";
import { env } from "@/utils/env";
import NonHomeRoutes from "./NonHomeRoutes";

const ReactQueryDevtools =
  env.DEV === true
    ? React.lazy(async () => {
        const module = await import("@tanstack/react-query-devtools");
        return {
          default: module.ReactQueryDevtools as unknown as React.ComponentType<any>,
        };
      })
    : null;

const NonHomeApp: React.FC = () => {
  return (
    <AuthProvider>
      <NonHomeRoutes />
      {ReactQueryDevtools !== null ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </AuthProvider>
  );
};

export default NonHomeApp;
