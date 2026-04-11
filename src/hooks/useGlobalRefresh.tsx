import { QueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useMemo, useState } from "react";

interface GlobalRefreshContextType {
  triggerRefresh: () => Promise<void>;
  screenRefreshKey: number;
  refreshing: boolean;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = async () => {
    if (refreshing) return;

    await queryClient.refetchQueries({ type: "active" });

    setScreenRefreshKey((prev) => prev + 1);
  };

  const value = useMemo(
    () => ({
      triggerRefresh,
      screenRefreshKey,
      refreshing,
      setRefreshing,
    }),
    [screenRefreshKey, refreshing],
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
