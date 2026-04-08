import { useGetParcels } from "@/src/api/parcelManagement.api";
import PageHeader from "@/src/components/ui/PageHeader";
import { useAuth } from "@/src/providers/AuthProvider";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ParcelManagement() {
  const { user, buildingId } = useAuth();

  const [count, setCount] = useState(0);

  const { data: parcelsResponse } = useGetParcels(
    {
      page: 1,
      limit: 10,
      // trackingId: debouncedTracking.trim() || undefined,
      buildingId: buildingId ?? undefined,
      residentId: undefined, // no resident filter — api/resident/building/{id} not used
    },
    !!user?.userId,
  );
  return (
    // <ScreenContainer>
    <View>
      <PageHeader
        title="Parcel Management"
        subtitle="View and manage all parcels delivered to your building"
      />
      <View className="p-4">
        <Text>Count{count}</Text>
      </View>
      <Pressable onPress={() => setCount(count + 1)}>
        <View className="m-4 p-4 bg-gray-200 rounded">
          <Text>Press here</Text>
        </View>
      </Pressable>
    </View>
    // </ScreenContainer>
  );
}
