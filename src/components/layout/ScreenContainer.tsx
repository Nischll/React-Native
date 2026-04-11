import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import React, { useCallback } from "react";
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
}

export default function ScreenContainer({
  children,
  scrollable = true,
  padded = true,
  backgroundClassName = "bg-primary",
  contentClassName = "bg-white",
  refreshable = true,
  ...props
}: ScreenContainerProps) {
  const { triggerRefresh, refreshing, setRefreshing } = useGlobalRefresh();

  const onRefresh = useCallback(async () => {
    if (!refreshable || refreshing) return;

    try {
      setRefreshing(true);
      await triggerRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshable, refreshing, triggerRefresh, setRefreshing]);

  const content = (
    <View className={`${padded ? "p-4" : ""} flex-1 ${contentClassName}`}>
      {children}
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
