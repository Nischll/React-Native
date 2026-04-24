import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useGetTradeVisitById } from "@/src/api/tradeManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import DatePickerField from "@/src/components/ui/DatePickerField";
import { useApiMutation } from "@/src/hooks/api/useApiMutation";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function TradeCheckin() {
  const { id } = useLocalSearchParams();
  const idNum = Number(id);

  const { data, isLoading } = useGetTradeVisitById(idNum);
  const trade = data?.data;

  const [timeIn, setTimeIn] = useState(new Date().toISOString());
  const [fobOrKeyAssigned, setFobOrKeyAssigned] = useState("");

  const checkinMutation = useApiMutation<{
    timeIn: string;
    fobOrKeyAssigned?: string;
  }>("post", `trade-visit/${idNum}/check-in`, {
    successMessage: "Checked in successfully",
  });

  const handleSubmit = () => {
    checkinMutation.mutate(
      {
        timeIn,
        fobOrKeyAssigned: fobOrKeyAssigned.trim() || undefined,
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!trade) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Trade visit not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <PageHeader
        title="Check In"
        subtitle="Record contractor arrival"
        icon="log-in"
        showBackButton
      />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TRADE INFO */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold text-base">{trade.tradeName}</Text>
          {trade.company ? (
            <Text className="text-gray-500 mt-0.5">{trade.company}</Text>
          ) : null}
          {trade.buildingName ? (
            <Text className="text-gray-400 text-xs mt-0.5">
              {trade.buildingName}
            </Text>
          ) : null}
        </Card>

        {/* CHECK-IN TIME */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-3">Check-In Time</Text>
          <DatePickerField
            value={timeIn}
            onChange={setTimeIn}
            showTime
            placeholder="Select check-in date & time"
          />
        </Card>

        {/* FOB / KEY */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-3">Key / Fob Assigned</Text>
          <AppInput
            placeholder="e.g. Fob-12 (optional)"
            value={fobOrKeyAssigned}
            onChangeText={setFobOrKeyAssigned}
          />
        </Card>

        {/* SUBMIT */}
        <View className="mb-6">
          <AppButton onPress={handleSubmit} loading={checkinMutation.isPending}>
            Confirm Check In
          </AppButton>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
