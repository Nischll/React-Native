import { ENABLE_DEBUG_LOGS } from "@/src/utils/debug";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const debugSessionStorage = async () => {
  if (!ENABLE_DEBUG_LOGS) return;

  const keys = await AsyncStorage.getAllKeys();
  const values = await AsyncStorage.multiGet(keys);

  console.log("🔐 SESSION STORAGE DEBUG");
  console.log("KEYS:", keys);
  console.log("VALUES:", values);
};
