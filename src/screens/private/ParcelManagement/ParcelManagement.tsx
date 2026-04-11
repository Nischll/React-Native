import { useGetParcels } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function ParcelManagement() {
  const { user, buildingId } = useAuth();

  const { data, isLoading, error } = useGetParcels(
    {
      page: 1,
      limit: 10,
      buildingId: buildingId ?? undefined,
    },
    !!user?.userId,
  );

  useEffect(() => {
    if (data) {
      console.log("📦 Parcels Response:", data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.log("❌ Parcel Fetch Error:", error);
    }
  }, [error]);

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="cube"
        title="Parcel Management"
        subtitle="View and manage all parcels delivered to your building"
      />

      <View className="mt-6">
        <AppButton onPress={() => router.push("/(private)/parcel-add-edit")}>
          Log Parcel
        </AppButton>
      </View>
    </View>
  );
}
