import { useDeleteResource, useGetResources } from "@/src/api/resources.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { RESOURCE_TYPE_OPTIONS, ResourceItem, ResourceType } from "@/src/types/resource.types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function Resources() {
  const { buildingId, user } = useAuth();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<ResourceType | "ALL">("ALL");
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetResources(
    { page, limit: 10, buildingId: buildingId ?? undefined, type: type === "ALL" ? undefined : type },
    !!user?.userId,
  );
  const { mutate: deleteMutate, isPending } = useDeleteResource(deleteItem?.id);

  const raw: any = data?.data;
  const items: ResourceItem[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const total: number = Array.isArray(raw) ? items.length : (raw?.total ?? items.length);

  const columns: MobileColumn<ResourceItem>[] = [
    { key: "fileName", label: "File Name", primary: true, searchable: true },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
    { key: "fileSizeDisplay", label: "Size" },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="folder-open" title="Resources" subtitle="Building documents and policies." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => router.push("/(private)/resources/resource-add-edit")}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[{ label: "All", value: "ALL" as const }, ...RESOURCE_TYPE_OPTIONS].map((t) => (
            <Pressable
              key={t.value}
              onPress={() => {
                setType(t.value as ResourceType | "ALL");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full border ${type === t.value ? "bg-primary border-primary" : "border-slate-300"}`}
            >
              <Text className={`text-xs font-semibold ${type === t.value ? "text-white" : "text-textPrimary"}`}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-1">
          <MobileDataList<ResourceItem>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No resources found"
            onRefresh={refetch}
            pagination={{ page, pageSize: 10, total, hasMore: page * 10 < total, onPageChange: setPage }}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "View",
                    icon: "eye",
                    onPress: () =>
                      router.push({ pathname: "/(private)/resources/resource-details", params: { id: String(row.id) } }),
                  },
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({ pathname: "/(private)/resources/resource-add-edit", params: { id: String(row.id) } }),
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
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteItem?.fileName}"?`}
        confirmText="Delete"
        destructive
        loading={isPending}
        onCancel={() => setDeleteItem(null)}
        onConfirm={() =>
          deleteMutate(undefined, {
            onSuccess: () => {
              setDeleteItem(null);
              refetch();
            },
            onError: () => setDeleteItem(null),
          })
        }
      />
    </>
  );
}
