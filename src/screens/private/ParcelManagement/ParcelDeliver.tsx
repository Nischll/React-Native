import { useDeliverParcel } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import SignaturePad from "@/src/components/ui/SignaturePad";
import { useAuth } from "@/src/providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParcelDeliver() {
  const { parcelId } = useLocalSearchParams();
  const { buildingId } = useAuth();
  const insets = useSafeAreaInsets();

  const [signature, setSignature] = useState("");
  const [padWidth, setPadWidth] = useState(0);

  const { mutate, isPending } = useDeliverParcel(
    Number(parcelId),
    buildingId ?? undefined,
  );

  const onPadAreaLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== padWidth) setPadWidth(w);
  };

  const handleSubmit = () => {
    if (!signature) {
      Alert.alert("Signature Required", "Please capture signature first.");
      return;
    }

    mutate(
      {
        pickupTimestamp: new Date().toISOString(),
        recipientSignature: signature,
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            router.back();
          }, 150);
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-white">
      <PageHeader
        showBackButton
        icon="checkmark-circle"
        title="Deliver Parcel"
        subtitle="Capture recipient signature"
      />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isPending}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
          flexGrow: 1,
        }}
      >
        <View className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <Text className="text-sm font-semibold text-slate-800">
            Recipient signature
          </Text>
          <Text className="text-xs text-slate-500 mt-1 mb-3">
            Sign in the box below with your finger
          </Text>

          <View onLayout={onPadAreaLayout} className="w-full overflow-hidden">
            {padWidth > 0 ? (
              <View pointerEvents={isPending ? "none" : "auto"}>
                <SignaturePad
                  width={padWidth}
                  height={Math.min(220, Math.round(padWidth * 0.55))}
                  onChange={setSignature}
                />
              </View>
            ) : (
              <View className="h-[180px] rounded-xl border border-dashed border-slate-300 bg-white" />
            )}
          </View>
        </View>

        <View className="mt-6">
          <AppButton loading={isPending} onPress={handleSubmit}>
            Confirm Delivery
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}
