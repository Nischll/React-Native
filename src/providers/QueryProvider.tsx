import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { GlobalRefreshProvider } from "../hooks/useGlobalRefresh";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {},
  },
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalRefreshProvider queryClient={queryClient}>
        {children}
      </GlobalRefreshProvider>
    </QueryClientProvider>
  );
}
