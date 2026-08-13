import AppIcon from "@/src/components/ui/AppIcon";
import { TRACKING_ID_MAX } from "@/src/types/parcelManagement.types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

/** Keep this stable — inline settings reset native scanning and 1D barcodes fail. */
const BARCODE_SCANNER_SETTINGS = {
  barcodeTypes: [
    "qr",
    "code128",
    "code39",
    "code93",
    "codabar",
    "ean13",
    "ean8",
    "upc_a",
    "upc_e",
    "itf14",
    "pdf417",
    "datamatrix",
    "aztec",
  ],
};

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-center text-white">
          Camera permission is required to scan parcel barcodes.
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          className="mt-4 rounded-xl bg-primary px-4 py-3"
        >
          <Text className="font-semibold text-white">Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={BARCODE_SCANNER_SETTINGS}
        onBarcodeScanned={(result) => {
          if (scannedRef.current) return;
          const scannedValue = (result.data ?? "").trim().slice(0, TRACKING_ID_MAX);
          if (!scannedValue) return;

          scannedRef.current = true;
          router.replace({
            pathname: "/(private)/parcel-management/parcel-add-edit",
            params: {
              scannedValue,
            },
          });
        }}
      />

      <View
        pointerEvents="box-none"
        className="absolute inset-0 items-center justify-center"
      >
        <View
          pointerEvents="none"
          style={{
            width: 300,
            height: 140,
            borderWidth: 2,
            borderColor: "#fff",
            borderRadius: 16,
          }}
        />
        <Text className="mt-4 px-8 text-center text-sm text-white">
          Align the barcode or QR code inside the frame
        </Text>
      </View>

      <Pressable
        onPress={() => setTorchOn((v) => !v)}
        className="absolute right-5 top-14 h-11 w-11 items-center justify-center rounded-full bg-black/50"
        hitSlop={8}
      >
        <AppIcon
          name={torchOn ? "flash" : "flash-outline"}
          size={22}
          color="#fff"
        />
      </Pressable>
    </View>
  );
}
