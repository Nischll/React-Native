import { useGetParcels } from "@/src/api/parcelManagement.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { ParcelResponse } from "@/src/types/parcelManagement.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ParcelManagement() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [trackingId, setTrackingId] = useState("");
  const [selectedParcel, setSelectedParcel] = useState<ParcelResponse | null>(
    null,
  );

  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = (parcel: ParcelResponse) => {
    setSelectedParcel(parcel);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setSelectedParcel(null);
    setMenuVisible(false);
  };

  const { data, isLoading, refetch, isRefetching } = useGetParcels(
    {
      page,
      limit: 10,
      buildingId: buildingId ?? undefined,
      trackingId: trackingId || undefined,
    },
    !!user?.userId,
  );

  const parcels = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

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
    <View className="flex-1 bg-gray-50">
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
            <TouchableOpacity onPress={() => openMenu(row)} className="p-2">
              <AppIcon name="ellipsis-vertical" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        />

        {menuVisible && selectedParcel && (
          <View className="absolute inset-0 z-50 bg-black/30 justify-end">
            {/* overlay click to close */}
            <TouchableOpacity
              className="flex-1"
              activeOpacity={1}
              onPress={closeMenu}
            />

            {/* menu box */}
            <View className="bg-white rounded-t-2xl p-4">
              <Text className="text-lg font-bold mb-3">Actions</Text>

              {/* Edit */}
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push({
                    pathname: "/(private)/parcel-add-edit",
                    params: { parcelId: selectedParcel.id },
                  });
                }}
                className="py-3"
              >
                <Text className="text-base">✏️ Edit Parcel</Text>
              </TouchableOpacity>

              {/* View */}
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push({
                    pathname: "/(private)/parcel-add-edit",
                    params: { parcelId: selectedParcel.id, mode: "view" },
                  });
                }}
                className="py-3"
              >
                <Text className="text-base">👁️ View Details</Text>
              </TouchableOpacity>

              {/* Delete (example) */}
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  console.log("delete parcel", selectedParcel.id);
                }}
                className="py-3"
              >
                <Text className="text-base text-red-500">🗑️ Delete</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity onPress={closeMenu} className="py-3 mt-2">
                <Text className="text-center text-gray-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
