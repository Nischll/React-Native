import { useDeliverParcel } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import SignaturePad from "@/src/components/ui/SignaturePad";
import { useAuth } from "@/src/providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function ParcelDeliver() {
  const { parcelId } = useLocalSearchParams();
  const { buildingId } = useAuth();
  const { width } = useWindowDimensions();

  const [signature, setSignature] = useState("");

  const { mutate, isPending } = useDeliverParcel(
    Number(parcelId),
    buildingId ?? undefined,
  );

  const handleSubmit = () => {
    if (!signature) {
      Alert.alert("Signature Required", "Please capture signature first.");
      return;
    }

    mutate(
      {
        // System-generated pickup time (same as web)
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
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isPending}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <Text className="mb-3 font-semibold text-gray-700">
          Recipient Signature
        </Text>

        <SignaturePad
          width={width - 32}
          height={220}
          onChange={setSignature}
          pointerEvents={isPending ? "none" : "auto"}
        />

        <View className="mt-8">
          <AppButton loading={isPending} onPress={handleSubmit}>
            Confirm Delivery
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}
