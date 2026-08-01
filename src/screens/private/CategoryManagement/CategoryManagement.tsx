import { useDeleteCategory, useGetCategories } from "@/src/api/category.api";
import { MobileColumn, MobileDataList } from "@/src/components/layout/MobileDataList";
import PageHeader from "@/src/components/layout/PageHeader";
import AnchoredPopupMenu from "@/src/components/ui/AnchoredPopMenu";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { Category } from "@/src/types/category.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function CategoryManagement() {
  const { user } = useAuth();
  const [deleteItem, setDeleteItem] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useGetCategories(
    { page, limit: PAGE_SIZE, search: search || undefined },
    !!user?.userId,
  );
  const { mutate: deleteMutate, isPending } = useDeleteCategory();
  const { items, total } = extractPaginatedList<Category>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<Category>[] = [
    { key: "name", label: "Name", primary: true, searchable: true },
  ];

  return (
    <>
      <View className="flex-1">
        <PageHeader showBackButton icon="pricetag" title="Category Management" subtitle="Manage task categories." />
        <View className="absolute bottom-6 right-6 z-50">
          <AnimatedPressable onPress={() => router.push("/(private)/category-management/category-add-edit")}>
            <View className="bg-primary rounded-full p-4 elevation-5">
              <AppIcon name="add" size={24} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
        <View className="flex-1">
          <MobileDataList<Category>
            data={items}
            columns={columns}
            loading={isLoading}
            refreshing={isRefetching}
            searchable
            backendMode
            onSearch={(value) => {
              setPage(1);
              setSearch(value);
            }}
            pagination={{
              page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
              onPageChange: setPage,
            }}
            keyExtractor={(item) => String(item.id)}
            emptyMessage="No categories found"
            onRefresh={refetch}
            renderActions={(row) => (
              <AnchoredPopupMenu
                items={[
                  {
                    label: "Edit",
                    icon: "create",
                    onPress: () =>
                      router.push({
                        pathname: "/(private)/category-management/category-add-edit",
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
        title="Delete Category"
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
