import Toast from "react-native-toast-message";

export function showToast(type: "success" | "error", message: string) {
  Toast.show({
    type,
    text1: type === "success" ? "Success" : "Error",
    text2: message,
    position: "bottom",
    visibilityTime: 2000,
    autoHide: true,
    bottomOffset: 60,
  });
}
