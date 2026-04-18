import PageHeader from "@/src/components/layout/PageHeader";
import { View } from "react-native";

export default function TradeManagement() {
  return (
    <>
      <View>
        <PageHeader
          title="Trade Mangement"
          subtitle="Contractor visits, bookings, check-in / checkout"
          icon="wallet"
          showBackButton
        />
      </View>
    </>
  );
}
