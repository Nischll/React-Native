import { useGetNotice, useGetReminders } from "@/src/api/activity.api";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { router } from "expo-router";
import { Text, View } from "react-native";

function ActivityPill({
  onPress,
  icon,
  iconColor,
  bgClass,
  borderClass,
  titleClass,
  bodyClass,
  title,
  body,
  badge,
  chevronColor,
}: {
  onPress: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  bgClass: string;
  borderClass: string;
  titleClass: string;
  bodyClass: string;
  title: string;
  body: string;
  badge?: number;
  chevronColor: string;
}) {
  return (
    <AnimatedPressable className="flex-1 min-w-[30%]" onPress={onPress}>
      <View
        className={`flex-row items-center gap-1.5 rounded-xl px-2.5 py-2 border ${bgClass} ${borderClass}`}
      >
        <AppIcon name={icon} size={14} color={iconColor} />
        <View className="flex-1 min-w-0">
          <Text
            className={`text-[9px] font-semibold uppercase tracking-wide ${titleClass}`}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className={`text-[11px] font-semibold mt-0.5 ${bodyClass}`}
            numberOfLines={1}
          >
            {body}
          </Text>
        </View>
        {badge != null && badge > 0 ? (
          <View
            className="rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center"
            style={{ backgroundColor: iconColor }}
          >
            <Text className="text-[9px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
        <AppIcon name="chevron-forward" size={11} color={chevronColor} />
      </View>
    </AnimatedPressable>
  );
}

export function ActivityBar() {
  const { buildingId } = useAuth();

  const { data: noticeData } = useGetNotice(1, 1, "all");
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
      ].reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  return (
    <View className="mx-4 -mt-4 z-10">
      <View className="flex-row flex-wrap gap-2 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100">
        <ActivityPill
          onPress={() => router.push("/(private)/activity?tab=notices")}
          icon="megaphone-outline"
          iconColor="#BA7517"
          bgClass="bg-amber-50"
          borderClass="border-amber-200"
          titleClass="text-amber-700"
          bodyClass="text-amber-900"
          title="Notices"
          body={unseenCount > 0 ? `${unseenCount} unread` : "All caught up"}
          badge={unseenCount}
          chevronColor="#BA7517"
        />
        <ActivityPill
          onPress={() => router.push("/(private)/activity?tab=reminders")}
          icon="alarm-outline"
          iconColor="#185FA5"
          bgClass="bg-blue-50"
          borderClass="border-blue-200"
          titleClass="text-blue-700"
          bodyClass="text-blue-900"
          title="Reminders"
          body={reminderCount > 0 ? `${reminderCount} today` : "Nothing due"}
          badge={reminderCount}
          chevronColor="#185FA5"
        />
        <ActivityPill
          onPress={() => router.push("/(private)/home/recommendations")}
          icon="bulb-outline"
          iconColor="#7C3AED"
          bgClass="bg-violet-50"
          borderClass="border-violet-200"
          titleClass="text-violet-700"
          bodyClass="text-violet-900"
          title="Ideas"
          body="Recommendations"
          chevronColor="#7C3AED"
        />
      </View>
    </View>
  );
}
