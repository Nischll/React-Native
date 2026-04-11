import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetInit } from "../api/auth.api";
import { resetAuthRefreshAttempts } from "../api/client";
import { BuildingSelectDialog } from "../components/ui/BuildingSelectDialog";
import { debugSessionStorage } from "../devTools/sessionDebugger";
import {
  clearSessionStorage,
  getStoredBuilding,
  removeStoredBuilding,
  // removeStoredUser,
  setStoredBuilding,
} from "../storage/sessionStorage";
import { BuildingItem, UserData } from "../types/auth.types";
import { ENABLE_DEBUG_LOGS } from "../utils/debug";

export interface AuthContextType {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refetchInit: () => void;
  refetchInitData: () => Promise<void>;
  user: UserData | null;
  loading: boolean;
  selectedBuilding: BuildingItem | null;
  setSelectedBuilding: (building: BuildingItem | null) => Promise<void>;
  buildingId: number | null;
  openBuildingSelectDialog: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refetchInit: () => {},
  refetchInitData: async () => {},
  user: null,
  loading: true,
  selectedBuilding: null,
  setSelectedBuilding: async () => {},
  buildingId: null,
  openBuildingSelectDialog: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuildingState] =
    useState<BuildingItem | null>(null);
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: fetchedInit,
    isLoading: pendingInit,
    refetch: refetchInit,
  } = useGetInit();

  // ------------------- INIT USER -------------------
  useEffect(() => {
    const initUser = async () => {
      if (pendingInit) {
        setLoading(true);
        return;
      }

      if (fetchedInit?.data) {
        const data = fetchedInit.data;
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setLoading(false);

      if (ENABLE_DEBUG_LOGS) {
        await debugSessionStorage();
      }
    };

    initUser();
  }, [fetchedInit, pendingInit]);

  const refetchInitData = async () => {
    setLoading(true);
    try {
      await refetchInit();
    } finally {
      setLoading(false);
    }
  };

  // ------------------- BUILDING HANDLER -------------------
  useEffect(() => {
    const handleBuilding = async () => {
      if (!user?.buildingList?.length) return;

      const buildings = user.buildingList;
      const storedBuilding = await getStoredBuilding();

      const isValidStored =
        storedBuilding &&
        buildings.some((b) => b.value === storedBuilding.value);

      if (isValidStored) {
        setSelectedBuildingState(storedBuilding);

        return;
      }

      if (buildings.length === 1) {
        setSelectedBuildingState(buildings[0]);
        await setStoredBuilding(buildings[0]);

        return;
      }

      setShowBuildingDialog(true);
    };

    handleBuilding();
  }, [user?.buildingList]);

  // ------------------- SET BUILDING -------------------
  const setSelectedBuilding = async (building: BuildingItem | null) => {
    setSelectedBuildingState(building);

    if (building) {
      await setStoredBuilding(building);
    } else {
      await removeStoredBuilding();
    }

    setShowBuildingDialog(false);

    if (ENABLE_DEBUG_LOGS) {
      await debugSessionStorage();
    }
  };

  const openBuildingSelectDialog = () => {
    setShowBuildingDialog(true);
  };

  // ------------------- LOGIN -------------------
  const login = async () => {
    try {
      resetAuthRefreshAttempts();
      const result = await refetchInit();

      if (result.data?.data) {
        setUser(result.data.data);
        setIsAuthenticated(true);
      }
    } finally {
      if (ENABLE_DEBUG_LOGS) {
        await debugSessionStorage();
      }
    }
  };

  // ------------------- LOGOUT -------------------
  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setSelectedBuildingState(null);

    await clearSessionStorage();
    queryClient.clear();

    setLoading(false);

    if (ENABLE_DEBUG_LOGS) {
      await debugSessionStorage();
    }
  };

  const buildingId = selectedBuilding?.value
    ? parseInt(selectedBuilding.value, 10)
    : null;

  const validBuildingId = !isNaN(buildingId as number) ? buildingId : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        user,
        loading,
        refetchInit,
        refetchInitData,
        selectedBuilding,
        setSelectedBuilding,
        buildingId: validBuildingId,
        openBuildingSelectDialog,
      }}
    >
      {children}

      {user?.buildingList && user.buildingList.length > 0 && (
        <BuildingSelectDialog
          open={showBuildingDialog}
          buildings={user.buildingList}
          selectedBuilding={selectedBuilding}
          onSelect={setSelectedBuilding}
          onClose={() => setShowBuildingDialog(false)}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
