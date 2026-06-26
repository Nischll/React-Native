import PageHeader from "@/src/components/layout/PageHeader";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { NoticesTab } from "./NoticesTab";
import { RemindersTab } from "./RemindersTab";

type Tab = "notices" | "reminders";

const TAB_CONFIG: { key: Tab; label: string }[] = [
  { key: "notices", label: "Notices" },
  { key: "reminders", label: "Reminders" },
];

export default function ActivityScreen() {
  const { tab } = useLocalSearchParams<{ tab?: Tab }>();
  const [activeTab, setActiveTab] = useState<Tab>(tab ?? "notices");
  const indicatorAnim = useRef(
    new Animated.Value(tab === "reminders" ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeTab === "notices" ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  return (
    <View className="flex-1">
      <PageHeader
        icon="notifications-outline"
        title="Activity"
        showBackButton
      />
      <View className="flex-row bg-slate-100 rounded-xl p-1 gap-1">
        {TAB_CONFIG.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            className="flex-1"
          >
            <View
              className={`rounded-lg py-2 px-3 items-center justify-center ${
                activeTab === t.key ? "bg-white border border-slate-200" : ""
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === t.key ? "text-primary" : "text-slate-400"
                }`}
              >
                {t.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <View className="flex-1">
        {activeTab === "notices" ? <NoticesTab /> : <RemindersTab />}
      </View>
    </View>
  );
}
