import { useLogoutMutation } from "@/src/api/auth.api";
import ScreenContainer from "@/src/components/layout/ScreenContainer";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Pressable, Text, TouchableOpacity, View } from "react-native";

export default function Dashboard() {
  const { logout, user, selectedBuilding } = useAuth();
  const { mutate: mutateLogout, isPending } = useLogoutMutation();

  const handleLogout = () => {
    mutateLogout(undefined, {
      onSuccess: () => {
        logout();
        router.replace("/(public)/login");
      },
    });
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="mb-8">
        <Text className="text-sm font-medium text-slate-500">Welcome back</Text>
        <Text className="mt-1 text-3xl font-bold text-slate-900">
          {user?.firstName || user?.fullName || "User"}
        </Text>
        <Text className="mt-2 text-base text-slate-500">
          Here’s a quick overview of your workspace.
        </Text>
      </View>
      {/* User Card */}
      <View className="mb-6 rounded-3xl bg-blue-600 px-5 py-6 shadow-sm">
        <Text className="text-sm font-medium text-blue-100">Logged in as</Text>
        <Text className="mt-2 text-2xl font-bold text-white">
          {user?.fullName || "N/A"}
        </Text>
        <Text className="mt-2 text-sm text-blue-100">
          @{user?.username || "username"}
        </Text>
        <Text className="mt-1 text-sm text-blue-100">
          {user?.email || "No email available"}
        </Text>
      </View>
      {/* Quick Stats */}
      <View className="mb-6 flex-row justify-between gap-4">
        <Pressable
          className="flex-1 rounded-2xl bg-white p-5 shadow-sm"
          onPress={() => router.push("/(private)/parcel-management")}
        >
          <AppIcon name="home" size={24} color="#4B5563" />
          <Text className="text-sm font-medium text-slate-500">
            Parcel Management
          </Text>
        </Pressable>

        <View className="flex-1 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-sm font-medium text-slate-500">Roles</Text>
          <Text className="mt-2 text-2xl font-bold text-slate-900">
            {user?.roleList?.length ?? 0}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl bg-white p-5 shadow-sm">
          <Text className="text-sm font-medium text-slate-500">Modules</Text>
          <Text className="mt-2 text-2xl font-bold text-slate-900">
            {user?.moduleList?.length ?? 0}
          </Text>
        </View>
      </View>
      {/* Building Info */}
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-slate-900">
          Active Building
        </Text>
        <Text className="mt-3 text-base text-slate-700">
          {selectedBuilding?.label || "No building assigned"}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          Your current working building is shown here.
        </Text>
      </View>
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-slate-900">
          Active Building
        </Text>
        <Text className="mt-3 text-base text-slate-700">
          {selectedBuilding?.label || "No building assigned"}
        </Text>
        <Text className="mt-1 text-sm text-slate-500">
          Your current working building is shown here.
        </Text>
      </View>
      {/* Roles */}
      <View className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <Text className="text-lg font-semibold text-slate-900 mb-4">
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
      {/* Logout Button */}
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
    </ScreenContainer>
  );
}
