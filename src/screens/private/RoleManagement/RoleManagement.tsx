import { useGetRoles } from "@/src/api/role.api";
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
import { RoleResponse } from "@/src/types/role.types";
import { PAGE_SIZE, extractPaginatedList } from "@/src/utils/listPagination";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function RoleManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isRefetching, refetch } = useGetRoles({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });

  const { items: roles, total } = extractPaginatedList<RoleResponse>(data, { page, limit: PAGE_SIZE });

  const columns: MobileColumn<RoleResponse>[] = [
    {
      key: "name",
      label: "Role",
      primary: true,
      searchable: true,
    },
    {
      key: "code",
      label: "Code",
      searchable: true,
    },
    {
      key: "description",
      label: "Description",
      render: (value) => <Text>{value ? String(value) : "—"}</Text>,
    },
  ];

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="shield-checkmark"
        title="Role Management"
        subtitle="Create roles and control feature-level permissions."
      />

      <View className="absolute bottom-6 right-6 z-50">
        <AnimatedPressable
          onPress={() =>
            router.push({
              pathname: "/(private)/role-management/role-add-edit",
            })
          }
        >
          <View className="bg-primary rounded-full p-4 elevation-5">
            <AppIcon name="add" size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>

      <View className="flex-1">
        <MobileDataList<RoleResponse>
          data={roles}
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
          keyExtractor={(item) => item.id.toString()}
          emptyMessage="No roles found"
          onRefresh={refetch}
          renderActions={(row) => {
            const items: MenuItem[] = [
              {
                label: "Edit",
                icon: "pencil",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/role-management/role-add-edit",
                    params: { roleId: row.id, role: JSON.stringify(row) },
                  }),
              },
              {
                label: "Permissions",
                icon: "key",
                onPress: () =>
                  router.push({
                    pathname: "/(private)/permission/[id]",
                    params: { id: row.id, roleName: row.name },
                  }),
              },
            ];

            return <AnchoredPopupMenu items={items} />;
          }}
        />
      </View>
    </View>
  );
}
