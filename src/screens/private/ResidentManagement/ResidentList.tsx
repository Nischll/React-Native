import {
  useDeleteResident,
  useGetAllResidents,
} from "@/src/api/resident.api";
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
import { ResidentResponse } from "@/src/types/resident.types";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

const STATUS_LABEL: Record<string, string> = {
  OWNER: "Owner",
  TENANT: "Tenant",
  PROPERTY_AGENT: "Property Agent",
};

export default function ResidentList() {
  const { buildingId } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteResident, setDeleteResident] =
    useState<ResidentResponse | null>(null);

  const { data, isLoading, isRefetching, refetch } = useGetAllResidents({
    page,
    limit: 10,
    buildingId: buildingId ?? undefined,
    search: search || undefined,
  });

  const { mutate: deleteResidentMutate, isPending } = useDeleteResident(
    deleteResident?.id,
  );

  const residents = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

  const handleDelete = () => {
    if (!deleteResident) return;
    deleteResidentMutate(undefined, {
      onSuccess: () => {
        setDeleteResident(null);
        refetch();
      },
      onError: () => setDeleteResident(null),
    });
  };

  const columns: MobileColumn<ResidentResponse>[] = [
    {
      key: "unit",
      label: "Unit",
      primary: true,
      searchable: true,
    },
    {
      key: "residentName",
      label: "Resident",
      searchable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Text className="font-semibold text-primary">
          {STATUS_LABEL[String(value)] ?? String(value ?? "—")}
        </Text>
      ),
    },
    {
      key: "parkingStall",
      label: "Parking",
      render: (value) => <Text>{value ? String(value) : "—"}</Text>,
    },
    {
      key: "storageLocker",
      label: "Storage",
      render: (value) => <Text>{value ? String(value) : "—"}</Text>,
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="people"
        title="Resident Management"
        subtitle="Browse, add, and manage residents in your building."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/resident-management/resident-add-edit",
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        <MobileDataList<ResidentResponse>
          data={residents}
          columns={columns}
          loading={isLoading}
          refreshing={isRefetching}
          searchable
          backendMode
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No residents found"
          onRefresh={refetch}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
          pagination={{
            page,
            pageSize: 10,
            hasMore: page * 10 < total,
            onPageChange: setPage,
          }}
          renderActions={(row) => {
            const items: MenuItem[] = [
              {
                label: "View Details",
                icon: "eye",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/resident-management/resident-details",
                    params: { residentId: row.id },
                  }),
              },
              {
                label: "Edit Resident",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname:
                      "/(private)/resident-management/resident-add-edit",
                    params: { residentId: row.id },
                  }),
              },
              {
                label: "Delete",
                icon: "trash",
                danger: true,
                onPress: () => setDeleteResident(row),
              },
            ];

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>

      <ConfirmModal
        visible={!!deleteResident}
        title="Delete Resident"
        message={`Are you sure you want to delete unit "${deleteResident?.unit}"? This cannot be undone.`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteResident(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}
