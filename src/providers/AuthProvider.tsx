import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetInit } from "../api/auth.api";
import { resetAuthRefreshAttempts } from "../api/client";
import { BuildingSelectDialog } from "../components/ui/BuildingSelectDialog";
import { BuildingItem, UserData } from "../types/auth.types";

const SELECTED_BUILDING_KEY = "selectedBuildingId";

export interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetchInit: () => void;
  user: UserData | null;
  loading: boolean;
  selectedBuilding: BuildingItem | null;
  setSelectedBuilding: (building: BuildingItem | null) => void;
  buildingId: number | null;
  openBuildingSelectDialog: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  refetchInit: () => {},
  user: null,
  loading: true,
  selectedBuilding: null,
  setSelectedBuilding: () => {},
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

  const {
    data: fetchedInit,
    isLoading: pendingInit,
    refetch: refetchInit,
  } = useGetInit();

  // Init API effect
  useEffect(() => {
    const initUser = async () => {
      if (pendingInit) return;
      if (fetchedInit?.data) {
        const data = fetchedInit.data;
        setUser(data);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    initUser();
  }, [fetchedInit, pendingInit]);

  // Handle building selection
  useEffect(() => {
    const handleBuilding = async () => {
      if (!user?.buildingList?.length) return;

      const buildings = user.buildingList;
      let parsed: BuildingItem | null = null;

      try {
        const stored = await AsyncStorage.getItem(SELECTED_BUILDING_KEY);
        if (stored) parsed = JSON.parse(stored);
      } catch {
        /* ignore */
      }

      const isValidStored =
        parsed && buildings.some((b) => b.value === parsed.value);
      if (isValidStored) {
        setSelectedBuildingState(parsed);
        return;
      }

      if (buildings.length === 1) {
        setSelectedBuildingState(buildings[0]);
        await AsyncStorage.setItem(
          SELECTED_BUILDING_KEY,
          JSON.stringify(buildings[0]),
        );
        return;
      }

      setShowBuildingDialog(true);
    };

    handleBuilding();
  }, [user?.buildingList]);

  const setSelectedBuilding = async (building: BuildingItem | null) => {
    setSelectedBuildingState(building);
    if (building) {
      await AsyncStorage.setItem(
        SELECTED_BUILDING_KEY,
        JSON.stringify(building),
      );
    } else {
      await AsyncStorage.removeItem(SELECTED_BUILDING_KEY);
    }
    setShowBuildingDialog(false);
  };

  const openBuildingSelectDialog = () => setShowBuildingDialog(true);

  const login = async () => {
    resetAuthRefreshAttempts();
    if (fetchedInit?.data) {
      const data = fetchedInit.data;
      setUser(data);
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    setSelectedBuildingState(null);
    await AsyncStorage.removeItem(SELECTED_BUILDING_KEY);
    setLoading(false);
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
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
