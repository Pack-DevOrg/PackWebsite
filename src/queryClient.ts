import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        networkMode: "online",
        refetchInterval: false,
        refetchIntervalInBackground: false,
      },
      mutations: {
        retry: 1,
        networkMode: "online",
      },
    },
  });
