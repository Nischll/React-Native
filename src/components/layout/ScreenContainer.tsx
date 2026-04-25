import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import React, { useCallback } from "react";
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;

  scrollable?: boolean;

  padded?: boolean;
  backgroundClassName?: string;
  contentClassName?: string;

  refreshable?: boolean;

  virtualized?: boolean;
}

export default function ScreenContainer({
  children,
  scrollable,
  virtualized = false,
  padded = true,
  backgroundClassName = "bg-white",
  contentClassName = "bg-white",
  refreshable = true,
  ...props
}: ScreenContainerProps) {
  const { triggerRefresh, refreshing, setRefreshing } = useGlobalRefresh();
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    if (!refreshable || refreshing) return;

    try {
      setRefreshing(true);
      await triggerRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshable, refreshing, triggerRefresh, setRefreshing]);

  const shouldScroll = scrollable ?? (virtualized ? false : true); // auto rule

  const content = (
    <View
      className={`${padded ? "p-4" : ""} flex-1 ${contentClassName}`}
      style={{ paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={`flex-1 ${backgroundClassName}`}
    >
      {shouldScroll ? (
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
