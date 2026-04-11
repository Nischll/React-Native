import { useLogoutMutation } from "@/src/api/auth.api";
import PageHeader from "@/src/components/layout/PageHeader";
import { useAuth } from "@/src/providers/AuthProvider";
import { Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { logout, user, selectedBuilding, openBuildingSelectDialog } =
    useAuth();
  const { mutate: mutateLogout, isPending } = useLogoutMutation();

  const handleLogout = () => {
    mutateLogout(undefined, {
      onSuccess: async () => {
        await logout();
        // router.replace("/(public)/login");
      },
    });
  };

  return (
    <View>
      <PageHeader
        icon="person"
        title="Profile"
        subtitle="Manage your account and workspace settings"
      />
      {/* User Info */}
      <View className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-slate-900">
          {user?.fullName || "N/A"}
        </Text>
        <Text className="mt-2 text-sm text-slate-500">
          @{user?.username || "username"}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          {user?.email || "No email available"}
        </Text>
      </View>
      {/* Building */}
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-slate-900">
          Active Building
        </Text>
        <Text className="mt-3 text-base text-slate-700">
          {selectedBuilding?.label || "No building assigned"}
        </Text>

        <TouchableOpacity
          onPress={openBuildingSelectDialog}
          className="mt-4 rounded-xl bg-blue-50 px-4 py-3"
        >
          <Text className="text-center font-medium text-blue-700">
            Change Building
          </Text>
        </TouchableOpacity>
      </View>
      {/* Roles */}
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-semibold text-slate-900">
          Assigned Roles
        </Text>

        {user?.roleList?.length ? (
          user.roleList.map((role) => (
            <View
              key={role.id}
              className="mb-3 rounded-xl bg-slate-100 px-4 py-3"
            >
              <Text className="text-base font-semibold text-slate-800">
                {role.name}
              </Text>
              <Text className="mt-1 text-sm text-slate-500">{role.code}</Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-slate-500">No roles assigned.</Text>
        )}
      </View>
      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={isPending}
        className={`mt-4 items-center rounded-2xl py-4 ${
          isPending ? "bg-red-300" : "bg-red-500"
        }`}
      >
        <Text className="text-base font-semibold text-white">
          {isPending ? "Logging out..." : "Log Out"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
