import { useGetNotice, useGetReminders } from "@/src/api/activity.api,";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";

import { router } from "expo-router";
import { Text, View } from "react-native";

export function ActivityBar() {
  const { buildingId } = useAuth();

  const { data: noticeData } = useGetNotice(1, 1);
  const { data: remindersData } = useGetReminders(
    buildingId ?? undefined,
    "today",
  );

  const unseenCount = noticeData?.data?.unseenCount ?? 0;

  const reminders = remindersData?.data;
  const reminderCount = reminders
    ? [
        reminders.tasks,
        reminders.bookings,
        reminders.preventiveMaintenance,
        reminders.tradeVisits,
      ].reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
    : 0;

  const hasNotices = unseenCount > 0;
  const hasReminders = reminderCount > 0;

  return (
    <View className="mx-4 -mt-4 z-10">
      <View className="flex-row gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        {/* Notices pill */}
        <AnimatedPressable
          className="flex-1"
          onPress={() => router.push("/(private)/activity?tab=notices")}
        >
          <View className="flex-row items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AppIcon name="megaphone-outline" size={16} color="#BA7517" />
            <View className="flex-1">
              <Text className="text-[9px] font-semibold text-amber-700 uppercase tracking-wide">
                Notices
              </Text>
              <Text className="text-xs font-semibold text-amber-900 mt-0.5">
                {hasNotices ? `${unseenCount} unread` : "All caught up"}
              </Text>
            </View>
            {hasNotices && (
              <View className="bg-amber-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-[9px] font-bold text-white">
                  {unseenCount > 99 ? "99+" : unseenCount}
                </Text>
              </View>
            )}
            <AppIcon name="chevron-forward" size={12} color="#BA7517" />
          </View>
        </AnimatedPressable>

        {/* Reminders pill */}
        <AnimatedPressable
          className="flex-1"
          onPress={() => router.push("/(private)/activity?tab=reminders")}
        >
          <View className="flex-row items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <AppIcon name="alarm-outline" size={16} color="#185FA5" />
            <View className="flex-1">
              <Text className="text-[9px] font-semibold text-blue-700 uppercase tracking-wide">
                Reminders
              </Text>
              <Text className="text-xs font-semibold text-blue-900 mt-0.5">
                {hasReminders ? `${reminderCount} today` : "Nothing due"}
              </Text>
            </View>
            {hasReminders && (
              <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-[9px] font-bold text-white">
                  {reminderCount > 99 ? "99+" : reminderCount}
                </Text>
              </View>
            )}
            <AppIcon name="chevron-forward" size={12} color="#185FA5" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
