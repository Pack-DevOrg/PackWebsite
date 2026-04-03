import { useMemo } from "react";
import { useAuth } from "@/auth/AuthContext";
import { createApiClient } from "./client";

export const useApiClient = () => {
  const { getAccessToken, tokens } = useAuth();

  return useMemo(
    () =>
      createApiClient(
        getAccessToken,
        () => tokens?.tokenType ?? "Bearer"
      ),
    [getAccessToken, tokens?.tokenType]
  );
};
