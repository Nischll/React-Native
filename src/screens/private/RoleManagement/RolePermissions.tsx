import {
  useGetRoleModules,
  useUpdateRoleModules,
} from "@/src/api/role.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { RoleModulePermission } from "@/src/types/role.types";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type PermissionKey = "canRead" | "canWrite" | "canUpdate" | "canDelete";

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "canRead", label: "Read" },
  { key: "canWrite", label: "Write" },
  { key: "canUpdate", label: "Update" },
  { key: "canDelete", label: "Delete" },
];

function PermissionCheckbox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-6 w-6 items-center justify-center rounded-md border ${
        checked ? "border-primary bg-primary" : "border-gray-300 bg-white"
      }`}
    >
      {checked && <AppIcon name="checkmark" size={14} color="#fff" />}
    </Pressable>
  );
}

export default function RolePermissions() {
  const { id, roleName } = useLocalSearchParams<{
    id?: string;
    roleName?: string;
  }>();
  const roleId = id ? Number(id) : undefined;

  const [modules, setModules] = useState<RoleModulePermission[]>([]);

  const { data, isLoading, isError } = useGetRoleModules(roleId);
  const { mutate: updateModules, isPending } = useUpdateRoleModules(roleId);

  useEffect(() => {
    if (data?.data) {
      setModules(data.data);
    }
  }, [data]);

  const toggle = (moduleId: number, key: PermissionKey) => {
    setModules((prev) =>
      prev.map((item) =>
        item.id === moduleId ? { ...item, [key]: !item[key] } : item,
      ),
    );
  };

  const toggleAll = (moduleId: number) => {
    setModules((prev) =>
      prev.map((item) => {
        if (item.id !== moduleId) return item;
        const allSelected =
          item.canRead && item.canWrite && item.canUpdate && item.canDelete;
        return {
          ...item,
          canRead: !allSelected,
          canWrite: !allSelected,
          canUpdate: !allSelected,
          canDelete: !allSelected,
        };
      }),
    );
  };

  const handleSave = () => {
    updateModules(modules, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <View className="flex-1">
      <PageHeader
        showBackButton
        icon="key"
        title="Permissions"
        subtitle={
          roleName
            ? `Manage module access for "${roleName}".`
            : "Manage module-level access for this role."
        }
      />

      {isLoading ? (
        <LoadingState message="Loading permissions." />
      ) : isError ? (
        <EmptyState
          title="Couldn't load permissions"
          message="Please try again later."
        />
      ) : modules.length === 0 ? (
        <EmptyState
          title="No modules found"
          message="There are no configurable modules for this role."
        />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {modules.map((item) => {
            const allSelected =
              item.canRead && item.canWrite && item.canUpdate && item.canDelete;
            return (
              <Card key={item.id} className="mb-3 p-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text
                    className="flex-1 pr-3 text-base font-bold text-textPrimary"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-textSecondary">All</Text>
                    <PermissionCheckbox
                      checked={!!allSelected}
                      onPress={() => toggleAll(item.id)}
                    />
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-4">
                  {PERMISSION_COLUMNS.map((col) => (
                    <View key={col.key} className="flex-row items-center gap-2">
                      <PermissionCheckbox
                        checked={!!item[col.key]}
                        onPress={() => toggle(item.id, col.key)}
                      />
                      <Text className="text-sm text-textSecondary">
                        {col.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      {!isLoading && !isError && modules.length > 0 && (
        <View className="pt-3">
          <AppButton loading={isPending} onPress={handleSave}>
            Save Changes
          </AppButton>
        </View>
      )}
    </View>
  );
}
