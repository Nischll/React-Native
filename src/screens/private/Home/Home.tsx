import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, View } from "react-native";
import ActiveBuildingCard from "./ActiveBuildingCard";

export default function Home() {
  const { user } = useAuth();

  const quickModules = [
    {
      title: "Parcels",
      subtitle: "Manage deliveries",
      icon: "cube",
      route: "/(private)/parcel-management",
    },
    {
      title: "Residents",
      subtitle: "View residents",
      icon: "people",
      route: "/(private)/(tabs)/modules",
    },
    {
      title: "Visitors",
      subtitle: "Track entries",
      icon: "walk",
      route: "/(private)/(tabs)/modules",
    },
    {
      title: "Complaints",
      subtitle: "Handle issues",
      icon: "document-text",
      route: "/(private)/(tabs)/modules",
    },
  ] as const;

  return (
    <View className="flex-1 ">
      {/*  TOP PRIMARY SECTION */}
      <View className="bg-primary px-4 pt-4 pb-8 rounded-b-3xl">
        {/* Header */}
        <PageHeader
          variant="dashboard"
          icon="person"
          title={`${user?.firstName || user?.fullName || "User"}`}
          subtitle={user?.email || "Welcome back to your dashboard!"}
        />

        {/* Search */}
        <AppInput
          placeholder="Search modules, residents, parcels..."
          leftIcon="search"
        />

        {/* Active Building */}
        <ActiveBuildingCard />
      </View>

      {/*  CONTENT AREA */}
      <View className="px-4 mt-6">
        {/* Quick Actions Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-textPrimary">
            Quick Actions
          </Text>

          <AnimatedPressable
            onPress={() => router.push("/(private)/(tabs)/modules")}
          >
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-medium text-primary">
                View All Modules
              </Text>

              <View className="items-center justify-center">
                <AppIcon name="chevron-forward" size={16} color="#453956" />
              </View>
            </View>
          </AnimatedPressable>
        </View>

        {/* Quick Actions Grid */}
        <View className="flex-row flex-wrap justify-between">
          {quickModules.map((item) => (
            <AnimatedPressable
              key={item.title}
              onPress={() => router.push(item.route)}
              className="mb-4 w-[23%] "
            >
              <Card className="items-center px-2 py-4">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <AppIcon name={item.icon} size={22} color="#453956" />
                </View>

                <Text className="text-center text-xs font-semibold text-textPrimary">
                  {item.title}
                </Text>
              </Card>
            </AnimatedPressable>
          ))}
        </View>
      </View>
    </View>
  );
}
