import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useGetTradeVisitById } from "@/src/api/tradeManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import DatePickerField from "@/src/components/ui/DatePickerField";
import SelectField from "@/src/components/ui/SelectField";
import SignaturePad from "@/src/components/ui/SignaturePad";
import { useApiMutation } from "@/src/hooks/api/useApiMutation";
import { TradeKeyFobStatus } from "@/src/types/tradeManagement.types";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const KEY_FOB_STATUS_OPTIONS = [
  { label: "Returned", value: "RETURNED" },
  { label: "On Hold", value: "ON_HOLD" },
];

export default function TradeCheckout() {
  const { id } = useLocalSearchParams();
  const idNum = Number(id);
  const { width } = useWindowDimensions();

  const { data, isLoading } = useGetTradeVisitById(idNum);
  const trade = data?.data;

  const [timeOut, setTimeOut] = useState(new Date().toISOString());
  const [keyFobStatus, setKeyFobStatus] = useState<TradeKeyFobStatus | "">("");
  const [signatureData, setSignatureData] = useState("");

  const signatureRequired = keyFobStatus !== "ON_HOLD";

  const checkoutMutation = useApiMutation<{
    timeOut: string;
    keyFobStatus: TradeKeyFobStatus;
    signatureData?: string;
  }>("post", `trade-visit/${idNum}/checkout`, {
    successMessage: "Checked out successfully",
  });

  const handleSubmit = () => {
    if (!keyFobStatus) return;

    checkoutMutation.mutate(
      {
        timeOut,
        keyFobStatus,
        signatureData:
          signatureRequired && signatureData ? signatureData : undefined,
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const isSubmitDisabled =
    !keyFobStatus || (signatureRequired && !signatureData);

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

  // pad width minus card padding (p-4 = 16 each side) minus ScrollView padding (p-4 = 16 each side)
  const sigWidth = width - 64;

  return (
    <View className="flex-1">
      <PageHeader
        title="Check Out"
        subtitle="Record contractor departure"
        icon="log-out"
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

        {/* CHECK-OUT TIME */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-3">Check-Out Time</Text>
          <DatePickerField
            value={timeOut}
            onChange={setTimeOut}
            showTime
            placeholder="Select check-out date & time"
          />
        </Card>

        {/* KEY / FOB STATUS */}
        <Card className="p-4 mb-4">
          <Text className="font-semibold mb-3">Key / Fob Status</Text>
          <SelectField
            placeholder="Select key/fob status"
            value={keyFobStatus}
            options={KEY_FOB_STATUS_OPTIONS}
            onChange={(v) => setKeyFobStatus(v as TradeKeyFobStatus)}
            mode="dropdown"
          />
        </Card>

        {/* SIGNATURE — hidden when ON_HOLD */}
        {signatureRequired && (
          <Card className="p-4 mb-4">
            <Text className="font-semibold mb-3">Signature</Text>
            <Text className="text-gray-400 text-xs mb-3">
              Please have the contractor sign below
            </Text>
            <SignaturePad
              width={sigWidth}
              height={180}
              onChange={setSignatureData}
            />
          </Card>
        )}

        {/* SUBMIT */}
        <View className="mb-6">
          <AppButton
            onPress={handleSubmit}
            loading={checkoutMutation.isPending}
            disabled={isSubmitDisabled}
          >
            Confirm Check Out
          </AppButton>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
