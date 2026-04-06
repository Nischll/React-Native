import { QueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useMemo, useState } from "react";

interface GlobalRefreshContextType {
  triggerRefresh: () => Promise<void>;
  screenRefreshKey: number;
}

const GlobalRefreshContext = createContext<GlobalRefreshContextType | null>(
  null,
);

export const GlobalRefreshProvider = ({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) => {
  const [screenRefreshKey, setScreenRefreshKey] = useState(0);

  const triggerRefresh = async () => {
    // 1. Refetch all active queries
    await queryClient.refetchQueries({ type: "active" });

    // 2. Force current screen subtree to remount
    setScreenRefreshKey((prev) => prev + 1);
  };

  const value = useMemo(
    () => ({
      triggerRefresh,
      screenRefreshKey,
    }),
    [screenRefreshKey],
  );

  return (
    <GlobalRefreshContext.Provider value={value}>
      {children}
    </GlobalRefreshContext.Provider>
  );
};

export const useGlobalRefresh = () => {
  const context = useContext(GlobalRefreshContext);
  if (!context) {
    throw new Error("useGlobalRefresh must be inside provider");
  }
  return context;
};
