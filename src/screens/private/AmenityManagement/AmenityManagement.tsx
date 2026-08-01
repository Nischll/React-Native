import { useDeleteAmenity, useGetAmenities } from "@/src/api/amenity.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { AmenityResponse } from "@/src/types/amenity.types";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function AmenityManagement() {
  const { user } = useAuth();
  const [deleteItem, setDeleteItem] = useState<AmenityResponse | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetAmenities(!!user?.userId);
  const { mutate: deleteMutate, isPending } = useDeleteAmenity();
  const items: AmenityResponse[] = data?.data ?? [];

  const columns: MobileColumn<AmenityResponse>[] = [
    { key: "name", label: "Name", primary: true, searchable: true },
    { key: "description", label: "Description" },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="fitness" title="Amenity Management" subtitle="Manage building amenities." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => router.push("/(private)/amenity-management/amenity-add-edit")}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<AmenityResponse>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No amenities found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({
                        pathname: "/(private)/amenity-management/amenity-add-edit",
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
        title="Delete Amenity"
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
