import { useGetDashboardStatistics } from "@/src/api/dashboard.api";
import { useGetCommunications } from "@/src/api/communication.api";
import { useGetPrivateInbox } from "@/src/api/privateMessage.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { isHiddenFromHome } from "@/src/helper/accountMenuModules";
import { StatCard } from "@/src/helper/dashboardStatCard";
import { flattenModules, hasModuleCode } from "@/src/helper/flattenModules";
import { mapIcon } from "@/src/helper/mapIcon";
import { mapToAppRoute } from "@/src/helper/mapToAppRoute";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { useAuth } from "@/src/providers/AuthProvider";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import MonthYearPicker from "@/src/components/ui/MonthYearPicker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { resolveProfilePicture } from "../Profile/Profile";
import { ActivityBar } from "./components/ActivityBar";
import SearchBar from "./components/SearchBar";

export default function Home() {
  const { user, buildingId, selectedBuilding, openBuildingSelectDialog } =
    useAuth();
  const { setUnseenUpdatesCount } = useGlobalRefresh();
  const canMessage = hasModuleCode(user?.moduleList ?? [], "D");

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

  const { data: communicationCountData } = useGetCommunications(
    1,
    1,
    "all",
    buildingId ?? undefined,
    canMessage,
  );
  const { data: privateCountData } = useGetPrivateInbox(1, 1, canMessage);

  const communicationUnseen =
    communicationCountData?.data?.unseenCount ?? 0;
  const privateUnseen =
    privateCountData?.data?.unreadConversationCount ?? 0;

  useEffect(() => {
    if (canMessage) setUnseenUpdatesCount(communicationUnseen);
  }, [canMessage, communicationUnseen, setUnseenUpdatesCount]);

  const stats = statsData?.data;

  const modules = user?.moduleList ?? [];

  const quickModules = flattenModules(modules)
    .filter(
      (mod) =>
        mod.path && !isHiddenFromHome(mod) && !mod.path.includes("/home/"),
    )
    .map((mod) => {
      const route = mapToAppRoute(mod.path);
      if (!route) return null;
      return {
        title: mod.name,
        icon: mapIcon(mod.icon),
        route,
        badge: 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (canMessage) {
    const titles = new Set(quickModules.map((m) => m.title.toLowerCase()));
    if (![...titles].some((t) => t.includes("communication"))) {
      quickModules.unshift({
        title: "Communications",
        icon: "chatbubbles",
        route: "/(private)/(tabs)/(updates)" as Href,
        badge: communicationUnseen,
      });
    }
    if (![...titles].some((t) => t.includes("private message"))) {
      quickModules.splice(Math.min(1, quickModules.length), 0, {
        title: "Private Messages",
        icon: "chatbubble-ellipses",
        route: "/(private)/private-messages" as Href,
        badge: privateUnseen,
      });
    }
    for (const item of quickModules) {
      const title = item.title.toLowerCase();
      if (title.includes("private message")) item.badge = privateUnseen;
      else if (title.includes("communication")) item.badge = communicationUnseen;
    }
  }

  const remoteAvatarUri = resolveProfilePicture(
    (user as any)?.profilePictureUrl,
    (user as any)?.profilePicturePath,
  );

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={20}
      extraHeight={120}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}
    >
      <View className="flex-1">
        <View className="bg-primary px-4 pt-4 pb-8 rounded-b-3xl">
          <PageHeader
            variant="dashboard"
            icon="person"
            title={`${user?.firstName || user?.fullName || "User"}`}
            subtitle={user?.email || "Welcome back to your dashboard!"}
            avatarUrl={user?.profilePictureUrl ? `${remoteAvatarUri}` : null}
            firstName={user?.firstName}
            lastName={user?.lastName}
          />

          <SearchBar />

          <View className="py-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0 pr-1">
                <Text className="text-sm font-semibold text-white/80">
                  Active Building
                </Text>
                <Text
                  className="mt-1 text-base font-bold text-white"
                  numberOfLines={2}
                >
                  {selectedBuilding?.label || "No building selected"}
                </Text>
              </View>

              <View className="h-16 w-16 shrink-0 items-center justify-center">
                <View
                  className="absolute h-full w-full bg-white"
                  style={{ borderRadius: 100 }}
                />
                <AppIcon name="business-outline" size={32} color="#453956" />
              </View>
            </View>

            <View className="mt-3 flex-row items-center gap-2">
              <AnimatedPressable
                onPress={openBuildingSelectDialog}
                className="flex-1 rounded-xl bg-white/15 border border-white/20 px-3 py-2 items-center justify-center"
              >
                <Text
                  className="text-sm font-semibold text-white text-center"
                  numberOfLines={1}
                >
                  Change Building
                </Text>
              </AnimatedPressable>

              <View className="flex-1">
                <MonthYearPicker
                  value={selectedMonth}
                  onChange={(val) => setSelectedMonth(val)}
                />
              </View>
            </View>
          </View>

          <View className="flex-row gap-2 mt-2">
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

          <Text className="text-center text-[10px] text-white/45 mt-2 tracking-wide">
            {new Date(selectedMonth + "-01")
              .toLocaleString("default", { month: "long", year: "numeric" })
              .toUpperCase()}
          </Text>
        </View>

        <ActivityBar />

        <View className="px-4 mt-3">
          <Text className="mb-3 text-lg font-semibold text-textPrimary">
            Quick Actions
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {quickModules.map((item) => (
              <AnimatedPressable
                key={item.title}
                onPress={() => router.push(item.route)}
                className="mb-3 w-[48%]"
              >
                <Card className="flex-row items-center gap-2 p-3 min-h-[72px]">
                  <View className="relative h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <AppIcon name={item.icon} size={20} color="#453956" />
                    {item.badge != null && item.badge > 0 ? (
                      <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger items-center justify-center">
                        <Text className="text-[9px] font-bold text-white">
                          {item.badge > 99 ? "99+" : item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    className="flex-1 text-xs font-semibold text-textPrimary"
                    numberOfLines={3}
                  >
                    {item.title}
                  </Text>
                  <AppIcon name="chevron-forward" size={14} color="#94A3B8" />
                </Card>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
