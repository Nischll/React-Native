import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { TRACKING_ID_MAX } from "@/src/types/parcelManagement.types";

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    requestPermission();
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["code128", "qr"],
        }}
        onBarcodeScanned={(result) => {
          if (scanned) return;

          setScanned(true);

          const scannedValue = result.data.trim().slice(0, TRACKING_ID_MAX);

          router.replace({
            pathname: "/(private)/parcel-management/parcel-add-edit",
            params: {
              scannedValue: scannedValue,
            },
          });
        }}
      />

      {/* Overlay */}
      <View className="absolute inset-0 items-center justify-center">
        <View
          style={{
            width: 260,
            height: 160,
            borderWidth: 2,
            borderColor: "#fff",
            borderRadius: 16,
          }}
        />
      </View>
    </View>
  );
}
