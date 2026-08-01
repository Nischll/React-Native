import { useDeleteBuilding, useGetBuildings } from "@/src/api/building.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { Building } from "@/src/types/building.types";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function BuildingManagement() {
  const { user } = useAuth();
  const [deleteItem, setDeleteItem] = useState<Building | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useGetBuildings(
    { page: 1, limit: 100, buildingName: search || undefined },
    !!user?.userId,
  );

  const { mutate: deleteMutate, isPending } = useDeleteBuilding();
  const items: Building[] = data?.data ?? [];

  const columns: MobileColumn<Building>[] = [
    { key: "name", label: "Name", primary: true, searchable: true },
    { key: "address", label: "Address", searchable: true },
    { key: "strataPlan", label: "Strata Plan" },
    { key: "totalFloor", label: "Total Floors" },
    { key: "noOfUnits", label: "No. of Units" },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="business" title="Building Management" subtitle="Manage buildings in your portfolio." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => router.push("/(private)/building-management/building-add-edit")}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<Building>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No buildings found"
            onRefresh={refetch}
            onSearch={(v) => setSearch(v)}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({
                        pathname: "/(private)/building-management/building-add-edit",
                        params: { id: String(row.id) },
                      }),
                  },
                  {
                    label: "Delete",
                    icon: "trash",
                    danger: true,
                    onPress: () => setDeleteItem(row),
                  },
                ]}
              />
            )}
          />
        </View>
      </View>
      <ConfirmModal
        visible={!!deleteItem}
        title="Delete Building"
        message={`Are you sure you want to delete "${deleteItem?.name}"?`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => {
          if (!deleteItem) return;
          deleteMutate({ id: deleteItem.id } as any, {
            onSuccess: () => {
              setDeleteItem(null);
              refetch();
            },
            onError: () => setDeleteItem(null),
          });
        }}
      />
    </>
  );
}
