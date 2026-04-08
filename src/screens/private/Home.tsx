import AppIcon from "@/src/components/ui/AppIcon";
import PageHeader from "@/src/components/ui/PageHeader";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Home() {
  const { user, selectedBuilding } = useAuth();

  const quickModules = [
    {
      title: "Parcels",
      subtitle: "Manage deliveries",
      icon: "cube-outline",
      route: "/(private)/parcel-management",
    },
    {
      title: "Residents",
      subtitle: "View residents",
      icon: "people-outline",
      route: "/(private)/(tabs)/modules",
    },
    {
      title: "Visitors",
      subtitle: "Track entries",
      icon: "walk-outline",
      route: "/(private)/(tabs)/modules",
    },
    {
      title: "Complaints",
      subtitle: "Handle issues",
      icon: "document-text-outline",
      route: "/(private)/(tabs)/modules",
    },
  ] as const;

  return (
    <View>
      <PageHeader
        title={`Hi, ${user?.firstName || user?.fullName || "User"}`}
        subtitle="Welcome back to your workspace"
      />

      {/* User Summary Card */}
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

      {/* Active Building */}
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

      {/* Quick Actions Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-900">
          Quick Actions
        </Text>

        <Pressable
          onPress={() => router.push("/(private)/(tabs)/modules")}
          className="flex-row items-center gap-1"
        >
          <Text className="text-sm font-medium text-blue-600">
            View All Modules
          </Text>
          <AppIcon name="chevron-forward" size={16} color="#2563EB" />
        </Pressable>
      </View>

      {/* Quick Actions Grid */}
      <View className="flex-row flex-wrap justify-between">
        {quickModules.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => router.push(item.route)}
            className="mb-4 w-[23%] items-center rounded-xl bg-white px-2 py-4 shadow-sm transition-colors duration-200 active:scale-95 active:bg-gray-50"
          >
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <AppIcon name={item.icon} size={22} color="#2563EB" />
            </View>

            <Text className="text-center text-xs font-semibold text-slate-900">
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
