import { ENABLE_DEBUG_LOGS } from "@/src/utils/debug";

export const initDevTools = async () => {
  if (!ENABLE_DEBUG_LOGS) return;

  console.log("🛠️ DevTools Initialized");
};
