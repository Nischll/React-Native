import { useDeliverParcel } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import DatePickerField from "@/src/components/ui/DatePickerField";
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
  const [pickupTimestamp, setPickupTimestamp] = useState(
    new Date().toISOString().slice(0, 16),
  );

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
        pickupTimestamp,
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
      >
        <DatePickerField
          value={pickupTimestamp}
          onChange={setPickupTimestamp}
        />

        <View className="mt-6">
          <Text className="mb-3 font-semibold text-gray-700">
            Recipient Signature
          </Text>

          <SignaturePad
            width={width - 32}
            height={220}
            onChange={setSignature}
            pointerEvents={isPending ? "none" : "auto"}
          />
        </View>

        <View className="mt-8">
          <AppButton loading={isPending} onPress={handleSubmit}>
            Confirm Delivery
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}
