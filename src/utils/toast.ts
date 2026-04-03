import { Alert } from "react-native";

export function showToast(type: "success" | "error", message: string) {
  Alert.alert(type === "success" ? "Success" : "Error", message);
}
