import { useDeleteParcel, useGetParcels } from "@/src/api/parcelManagement.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AppButton from "@/src/components/ui/AppButton";
import { useAuth } from "@/src/providers/AuthProvider";
import { ParcelResponse } from "@/src/types/parcelManagement.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ParcelManagement() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [trackingId, setTrackingId] = useState("");
  const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(
    null,
  );

  const { data, isLoading, refetch, isRefetching } = useGetParcels(
    {
      page,
      limit: 10,
      buildingId: buildingId ?? undefined,
      trackingId: trackingId || undefined,
    },
    !!user?.userId,
  );

  const { mutate: deleteParcel, isPending } = useDeleteParcel(
    selectedParcel?.id,
    buildingId ?? 0,
  );

  const parcels = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const handleDeleteParcel = (data: ParcelResponse) => {
    if (!selectedParcel) return;
    setSelectedParcel(data);

    deleteParcel(undefined, {
      onSuccess: () => {
        setSelectedParcel(null);
        refetch();
      },
    });
  };

  const columns: MobileColumn<ParcelResponse>[] = [
    {
      key: "trackingId",
      label: "Tracking ID",
      primary: true,
      searchable: true,
    },
    {
      key: "residentName",
      label: "Resident",
      searchable: true,
    },
    {
      key: "unit",
      label: "Unit",
      searchable: true,
    },
    {
      key: "courier",
      label: "Courier",
    },
    {
      key: "packageType",
      label: "Package Type",
    },
    {
      key: "size",
      label: "Size",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Text
          className={`font-semibold ${
            value === "DELIVERED"
              ? "text-green-600"
              : value === "RECEIVED"
                ? "text-blue-600"
                : "text-gray-600"
          }`}
        >
          {String(value)}
        </Text>
      ),
    },
    {
      key: "receivedTime",
      label: "Received",
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  return (
    <View className="flex-1 ">
      <PageHeader
        showBackButton
        icon="cube"
        title="Parcel Management"
        subtitle="View and manage all parcels delivered to your building"
      />

      <View className="px-4 mt-4">
        <AppButton onPress={() => router.push("/(private)/parcel-add-edit")}>
          Log Parcel
        </AppButton>
      </View>

      <View className="flex-1 px-4 mt-4">
        <MobileDataList<ParcelResponse>
          data={parcels}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No parcels found"
          onRefresh={refetch}
          onSearch={(value) => {
            setPage(1);
            setTrackingId(value);
          }}
          pagination={{
            page,
            pageSize: 10,
            hasMore: page * 10 < total,
            onPageChange: setPage,
          }}
          renderActions={(row) => (
            <AnchoredPopupMenu
              items={[
                {
                  label: "View Details",
                  icon: "eye",
                  onPress: () =>
                    router.push({
                      pathname: "/(private)/parcel-details",
                      params: {
                        parcelId: row.id,
                        mode: "view",
                      },
                    }),
                },
                {
                  label: "Remind",
                  icon: "notifications",
                  onPress: () => console.log("Remind", row.id),
                },
                {
                  label: "Deliver",
                  icon: "checkmark-circle",
                  onPress: () => console.log("Deliver", row.id),
                },
                {
                  label: "Edit Parcel",
                  icon: "pencil",
                  onPress: () =>
                    router.push({
                      pathname: "/(private)/parcel-add-edit",
                      params: { parcelId: row.id },
                    }),
                },
                {
                  label: "Delete",
                  icon: "trash",
                  danger: true,
                  onPress: () => handleDeleteParcel(row),
                },
              ]}
            />
          )}
        />
      </View>
    </View>
  );
}
