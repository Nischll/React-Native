import { useGetDashboardStatistics } from "@/src/api/dashboard.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import Card from "@/src/components/ui/Card";
import { StatCard } from "@/src/helper/dashboardStatCard";
import { flattenModules } from "@/src/helper/flattenModules";
import { mapIcon } from "@/src/helper/mapIcon";
import { mapToAppRoute } from "@/src/helper/mapToAppRoute";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";
import { Text, View } from "react-native";

import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { useState } from "react";

export default function Home() {
  const { user, buildingId, selectedBuilding, openBuildingSelectDialog } =
    useAuth();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
  });

  const { data: statsData, isLoading: statsLoading } =
    useGetDashboardStatistics(
      buildingId ?? undefined,
      selectedMonth,
      !!buildingId,
    );

  const stats = statsData?.data;

  const modules = user?.moduleList ?? [];
  const ALLOWED_MODULE_CODES = ["PARCEL", "TRM", "BI"];

  const quickModules = flattenModules(modules)
    .filter((mod) => mod.path && ALLOWED_MODULE_CODES.includes(mod.code))
    .map((mod) => {
      const route = mapToAppRoute(mod.path);
      if (!route) return null;
      return { title: mod.name, icon: mapIcon(mod.icon), route };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <View className="flex-1">
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
        <View className="flex-row items-center justify-between py-5">
          {/* LEFT SIDE */}
          <View className="flex-1 pr-4">
            {/* Title */}
            <Text className="text-sm font-semibold text-white/80">
              Active Building
            </Text>

            {/* Building Name */}
            <Text className="mt-1 text-md font-bold text-white">
              {selectedBuilding?.label || "No building selected"}
            </Text>

            {/* Button */}
            <View className="flex-row items-center gap-4">
              <AnimatedPressable
                onPress={openBuildingSelectDialog}
                className="mt-3 self-start rounded-xl bg-white/15 border border-white/20 px-4 py-2"
              >
                <Text className="text-sm font-semibold text-white">
                  Change Building
                </Text>
              </AnimatedPressable>

              <MonthYearPicker
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
              />
            </View>
          </View>

          {/* RIGHT SIDE - HEXAGON ICON */}
          <View className="h-24 w-24 items-center justify-center">
            <View
              className="absolute h-full w-full bg-white"
              style={{
                // transform: [{ rotate: "45deg" }],
                borderRadius: 100,
              }}
            />

            {/* Icon on top */}
            <AppIcon name="business-outline" size={50} color="#453956" />
          </View>
        </View>

        {/* ── Statistics row ── */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 14,
          }}
        >
          <StatCard
            icon="calendar-outline"
            label="Bookings"
            value={stats?.totalBookings ?? 0}
            loading={statsLoading}
          />
          <StatCard
            icon="cash-outline"
            label="Revenue"
            value={
              stats?.totalRevenue != null
                ? `$${stats.totalRevenue.toLocaleString()}`
                : "—"
            }
            loading={statsLoading}
          />
          <StatCard
            icon="warning-outline"
            label="Violations"
            value={stats?.totalViolations ?? 0}
            loading={statsLoading}
          />
        </View>

        {/* Month label */}
        <Text
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "rgba(255,255,255,0.45)",
            marginTop: 8,
            letterSpacing: 0.5,
          }}
        >
          {new Date(selectedMonth + "-01")
            .toLocaleString("default", { month: "long", year: "numeric" })
            .toUpperCase()}
        </Text>
      </View>

      {/* ── Content area ── */}
      <View className="px-4 mt-6">
        {/* Quick Actions header */}
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

        {/* Quick Actions grid */}
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
