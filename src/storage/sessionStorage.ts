import { ENABLE_DEBUG_LOGS } from "@/src/utils/debug";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BuildingItem } from "../types/auth.types";

export const STORAGE_KEYS = {
  // USER: "user",
  SELECTED_BUILDING: "selectedBuildingId",
} as const;

// ---------------- USER ----------------
// export const setStoredUser = async (user: UserData) => {
//   if (ENABLE_DEBUG_LOGS) {
//     console.log("💾 SET USER", user);
//   }

//   await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
// };

// export const getStoredUser = async (): Promise<UserData | null> => {
//   const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);

//   if (ENABLE_DEBUG_LOGS) {
//     console.log("📦 GET USER", user);
//   }

//   return user ? JSON.parse(user) : null;
// };

// export const removeStoredUser = async () => {
//   if (ENABLE_DEBUG_LOGS) {
//     console.log("🗑️ REMOVE USER");
//   }

//   await AsyncStorage.removeItem(STORAGE_KEYS.USER);
// };

// ---------------- BUILDING ----------------
export const setStoredBuilding = async (building: BuildingItem) => {
  if (ENABLE_DEBUG_LOGS) {
    console.log("💾 SET BUILDING", building);
  }

  await AsyncStorage.setItem(
    STORAGE_KEYS.SELECTED_BUILDING,
    JSON.stringify(building),
  );
};

export const getStoredBuilding = async (): Promise<BuildingItem | null> => {
  const building = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_BUILDING);

  return building ? JSON.parse(building) : null;
};

export const removeStoredBuilding = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_BUILDING);
};

// ---------------- SESSION CLEANUP ----------------
export const clearSessionStorage = async () => {
  if (ENABLE_DEBUG_LOGS) {
    console.log("🧹 CLEAR SESSION STORAGE");
  }

  await AsyncStorage.multiRemove([
    // STORAGE_KEYS.USER,
    STORAGE_KEYS.SELECTED_BUILDING,
  ]);
};
