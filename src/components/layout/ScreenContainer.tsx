import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import React, { useCallback } from "react";
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StatusBar,
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
  /** Extra bottom safe-area padding. Turn off inside tab screens. */
  safeBottom?: boolean;
}

export default function ScreenContainer({
  children,
  scrollable,
  virtualized = false,
  padded = true,
  backgroundClassName = "bg-white",
  contentClassName = "bg-white",
  refreshable = true,
  safeBottom = true,
  ...props
}: ScreenContainerProps) {
  const { triggerRefresh, refreshing, setRefreshing } = useGlobalRefresh();
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await triggerRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [refreshable, refreshing, triggerRefresh, setRefreshing]);

  const shouldScroll = scrollable ?? (virtualized ? false : true);

  const content = (
    <View
      className={`${padded ? "p-4" : ""} flex-1 ${contentClassName}`}
      style={safeBottom ? { paddingBottom: insets.bottom } : undefined}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={`flex-1 ${backgroundClassName}`}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
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
      ) : refreshable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
