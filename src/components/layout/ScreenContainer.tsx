import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  backgroundClassName?: string;
  contentClassName?: string;
  refreshable?: boolean;
  showRefreshOverlay?: boolean;
}

export default function ScreenContainer({
  children,
  scrollable = true,
  padded = true,
  backgroundClassName = "bg-slate-100",
  contentClassName = "",
  refreshable = true,
  showRefreshOverlay = true,
  ...props
}: ScreenContainerProps) {
  const { triggerRefresh } = useGlobalRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!refreshable || refreshing) return;

    try {
      setRefreshing(true);
      await triggerRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshable, refreshing, triggerRefresh]);

  const content = (
    <View
      className={`${padded ? "p-4" : ""} relative flex-1 ${contentClassName}`}
    >
      {children}
      {showRefreshOverlay && refreshing && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          {/* <View className="rounded-2xl bg-white px-6 py-4 shadow">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm font-medium text-slate-700">
              Refreshing...
            </Text>
          </View> */}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${backgroundClassName}`}>
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            refreshable ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
