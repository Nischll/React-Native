import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import { flattenModules } from "@/src/helper/flattenModules";
import { mapIcon } from "@/src/helper/mapIcon";
import { mapToAppRoute } from "@/src/helper/mapToAppRoute";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, View } from "react-native";
import ActiveBuildingCard from "./ActiveBuildingCard";

export default function Home() {
  const { user } = useAuth();

  const modules = user?.moduleList ?? [];

  const ALLOWED_MODULE_CODES = ["PARCEL", "TRM", "BI"];

  const quickModules = flattenModules(modules)
    .filter((mod) => mod.path && ALLOWED_MODULE_CODES.includes(mod.code))
    .map((mod) => {
      const route = mapToAppRoute(mod.path);

      if (!route) return null;

      return {
        title: mod.name,
        icon: mapIcon(mod.icon),
        route,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

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
          placeholder="Search modules, parcels..."
          leftIcon="search"
          size="sm"
        />

        {/* Active Building */}
        <ActiveBuildingCard />
      </View>

      {/*  CONTENT AREA */}
      <View className="px-4 mt-6">
        {/* Quick Actions Header */}
        <View className="mb-2 flex-row items-center justify-between">
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
              className="mb-4 w-[49%]"
            >
              <Card className="flex-row justify-between items-center p-2">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <AppIcon name={item.icon} size={22} color="#453956" />
                </View>

                <Text
                  className="text-xs font-semibold text-textPrimary flex-1 text-center"
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <AppIcon name="chevron-forward" size={16} />
              </Card>
            </AnimatedPressable>
          ))}
        </View>
      </View>
    </View>
  );
}
