import React, { Suspense } from "react";
import { AuthProvider } from "@/auth/AuthContext";

const AuthCallbackPage = React.lazy(async () => {
  const module = await import("../pages/AuthCallbackPage");
  return { default: module.AuthCallbackPage };
});

const AuthCallbackRoute: React.FC = () => (
  <AuthProvider>
    <Suspense fallback={null}>
      <AuthCallbackPage />
    </Suspense>
  </AuthProvider>
);

export default AuthCallbackRoute;
