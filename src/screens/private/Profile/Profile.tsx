import { useLogoutMutation } from "@/src/api/auth.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import Card from "@/src/components/ui/Card";
import { useAuth } from "@/src/providers/AuthProvider";
import { Text, View } from "react-native";

export default function Profile() {
  const { logout, user, selectedBuilding, openBuildingSelectDialog } =
    useAuth();

  const { mutate: mutateLogout, isPending } = useLogoutMutation();

  const handleLogout = () => {
    mutateLogout(undefined, {
      onSuccess: async () => {
        await logout();
      },
    });
  };

  return (
    <View className="flex-1 ">
      <PageHeader
        icon="person"
        title="Profile"
        subtitle="Manage your account and workspace settings"
      />

      <View className="mt-4 gap-4">
        {/* USER INFO */}
        <Card className="p-5">
          <Text className="text-lg font-semibold text-textPrimary">
            {user?.fullName || "N/A"}
          </Text>

          <Text className="mt-2 text-sm text-textMuted">
            @{user?.username || "username"}
          </Text>

          <Text className="mt-1 text-sm text-textSecondary">
            {user?.email || "No email available"}
          </Text>
        </Card>

        {/* ACTIVE BUILDING */}
        <Card className="p-5">
          <Text className="text-lg font-semibold text-textPrimary">
            Active Building
          </Text>

          <Text className="my-3 text-base text-textSecondary">
            {selectedBuilding?.label || "No building assigned"}
          </Text>

          <AppButton
            variant="secondary"
            size="sm"
            // className="mt-4"
            onPress={openBuildingSelectDialog}
          >
            Change Building
          </AppButton>
        </Card>

        {/* ROLES */}
        <Card className="p-5">
          <Text className="mb-4 text-lg font-semibold text-textPrimary">
            Assigned Roles
          </Text>

          {user?.roleList?.length ? (
            <View className="gap-3">
              {user.roleList.map((role) => (
                <View
                  key={role.id}
                  className="rounded-xl bg-surfaceMuted px-4 py-3"
                >
                  <Text className="text-base font-semibold text-textPrimary">
                    {role.name}
                  </Text>

                  <Text className="mt-1 text-sm text-textMuted">
                    {role.code}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-textMuted">No roles assigned.</Text>
          )}
        </Card>

        {/* LOGOUT */}
        <AppButton variant="danger" loading={isPending} onPress={handleLogout}>
          Log Out
        </AppButton>
      </View>
    </View>
  );
}
