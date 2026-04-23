import {
  useDeleteParcel,
  useDeliverParcel,
  useGetParcels,
  useRemindParcel,
} from "@/src/api/parcelManagement.api";
import {
  MobileColumn,
  MobileDataList,
} from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu, {
  MenuItem,
} from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { ParcelResponse } from "@/src/types/parcelManagement.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ParcelManagement() {
  const { user, buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [trackingId, setTrackingId] = useState("");
  const [deleteParcel, setDeleteParcel] = useState<ParcelResponse | null>(null);
  const [remindParcel, setRemindParcel] = useState<ParcelResponse | null>(null);
  const [deliverParcel, setDeliverParcel] = useState<ParcelResponse | null>(
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

  const { mutate: deleteParcelMutate, isPending } = useDeleteParcel(
    deleteParcel?.id,
    buildingId ?? undefined,
  );

  const { mutate: remindParcelMutate, isPending: remindParcelPending } =
    useRemindParcel(remindParcel?.id, buildingId ?? undefined);

  const { mutate: deliverParcelMutate, isPending: deliverParcelPending } =
    useDeliverParcel(deliverParcel?.id, buildingId ?? undefined);

  const parcels = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const handleDeleteParcel = () => {
    if (!deleteParcel) return;

    deleteParcelMutate(undefined, {
      onSuccess: () => {
        setDeleteParcel(null);
        refetch();
      },
      onError: () => {
        setDeleteParcel(null);
      },
    });
  };

  const handleRemindParcel = () => {
    if (!remindParcel) return;
    remindParcelMutate(undefined, {
      onSuccess: () => {
        setRemindParcel(null);
        refetch();
      },
      onError: () => {
        setRemindParcel(null);
      },
    });
  };

  const handleDeliverParcel = () => {
    if (!deliverParcel) return;

    deliverParcelMutate(undefined, {
      onSuccess: () => {
        setDeliverParcel(null);
        refetch();
      },
      onError: () => {
        setDeliverParcel(null);
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
      // primary: true,
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
    <>
      <View className="flex-1">
        <PageHeader
          showBackButton
          icon="cube"
          title="Parcel Management"
          subtitle="View and manage all parcels delivered to your building."
        />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable
            onPress={() =>
              router.push({
                pathname: "/(private)/parcel-add-edit",
                params: { mode: "create" },
              })
            }
          >
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>

        {/* <View>
          <AppButton onPress={() => router.push("/(private)/parcel-add-edit")}>
            Log Parcel
          </AppButton>
        </View> */}

        <View className="flex-1">
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
            renderActions={(row) => {
              const isDelivered = row.status === "DELIVERED";

              const items = [
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

                ...(!isDelivered
                  ? [
                      {
                        label: "Remind",
                        icon: "notifications",
                        onPress: () => setRemindParcel(row),
                      },
                      {
                        label: "Deliver",
                        icon: "checkmark-circle",
                        onPress: () =>
                          router.push({
                            pathname: "/(private)/parcel-deliver",
                            params: { parcelId: row.id },
                          }),
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
                        onPress: () => setDeleteParcel(row),
                      },
                    ]
                  : []),
              ] as MenuItem[];

              return <AnchoredPopupMenu items={items} />;
            }}
          />
        </View>
        <ConfirmModal
          visible={!!deleteParcel}
          title="Delete Parcel"
          message={`Are you sure you want to delete parcel "${deleteParcel?.trackingId}"?`}
          confirmText="Delete"
          destructive
          loading={isPending}
          onCancel={() => setDeleteParcel(null)}
          onConfirm={handleDeleteParcel}
        />
        <ConfirmModal
          visible={!!remindParcel}
          title="Remind Parcel"
          message={`A reminder email will be sent to the resident notifying them to collect parcel "${remindParcel?.trackingId}".`}
          confirmText="Confirm"
          loading={remindParcelPending}
          onCancel={() => setRemindParcel(null)}
          onConfirm={handleRemindParcel}
        />
      </View>
    </>
  );
}
