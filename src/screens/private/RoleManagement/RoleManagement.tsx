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
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function RoleManagement() {
  const { data, isLoading, isRefetching, refetch } = useGetRoles();

  const roles = data?.data ?? [];

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
