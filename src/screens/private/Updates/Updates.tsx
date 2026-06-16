import { useGetCommunications } from "@/src/api/communication.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { useAuth } from "@/src/providers/AuthProvider";
import { NoticeCard } from "@/src/screens/private/Updates/components/NoticeCard";
import { NoticeComposer } from "@/src/screens/private/Updates/components/NoticeComposer";
import { CommunicationItem, SeenStatus } from "@/src/types/communication.types";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const TABS: { label: string; value: SeenStatus }[] = [
  { label: "All", value: "all" },
  { label: "Unseen", value: "unseen" },
  { label: "Seen", value: "seen" },
];

const LIMIT = 10;

export default function Updates() {
  const { selectedBuilding } = useAuth();
  const buildingId = selectedBuilding
    ? Number(selectedBuilding.value)
    : undefined;

  const [activeTab, setActiveTab] = useState<SeenStatus>("all");
  const [page, setPage] = useState(1);
  const [allNotices, setAllNotices] = useState<CommunicationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  const { setUnseenUpdatesCount } = useGlobalRefresh();

  const isResetRef = useRef(false);

  const { data, isLoading, isFetching, refetch } = useGetCommunications(
    page,
    LIMIT,
    activeTab,
    buildingId,
  );

  const notices = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const unseenCount = data?.data?.unseenCount ?? 0;
  const seenCount = data?.data?.seenCount ?? 0;

  const activeTabTotal =
    activeTab === "unseen"
      ? unseenCount
      : activeTab === "seen"
        ? seenCount
        : total;

  useEffect(() => {
    setUnseenUpdatesCount(unseenCount);
  }, [unseenCount]);

  useEffect(() => {
    if (notices.length === 0 && page === 1) {
      setAllNotices([]);
      return;
    }
    if (page === 1 || isResetRef.current) {
      setAllNotices(notices);
      isResetRef.current = false;
    } else {
      setAllNotices((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const fresh = notices.filter((n) => !existingIds.has(n.id));
        return [...prev, ...fresh];
      });
    }
  }, [notices]);

  const hasMore =
    !isLoading &&
    !isFetching &&
    allNotices.length > 0 &&
    allNotices.length < activeTabTotal;

  const handleTabChange = (tab: SeenStatus) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setAllNotices([]);
    isResetRef.current = true;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setOpenSwipeId(null);
    isResetRef.current = true;
    if (page !== 1) {
      setPage(1);
    } else {
      await refetch();
    }
    setRefreshing(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>
        <PageHeader
          icon="chatbubbles"
          title="Communications"
          subtitle={
            unseenCount > 0
              ? `${unseenCount} new update${unseenCount > 1 ? "s" : ""}`
              : "Stay in the loop with your team"
          }
        />

        <NoticeComposer />

        {/* ── Seen status tabs ── */}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            backgroundColor: "#fff",
            paddingHorizontal: 16,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => handleTabChange(tab.value)}
                style={{
                  marginRight: 20,
                  paddingVertical: 6,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? "#7C3AED" : "transparent",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isActive ? "#7C3AED" : "#94A3B8",
                    }}
                  >
                    {tab.label}
                  </Text>
                  {/* Show unseen badge on the Unseen tab */}
                  {tab.value === "unseen" && unseenCount > 0 && (
                    <View
                      style={{
                        backgroundColor: "#7C3AED",
                        borderRadius: 99,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        minWidth: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        {unseenCount > 99 ? "99+" : unseenCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={allNotices}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setOpenSwipeId(null)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={{ flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    paddingBottom: 24,
                    gap: 12,
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <View
                    style={{
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: "#F1F5F9",
                      marginBottom: 4,
                    }}
                  />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 48,
                }}
              >
                <Text style={{ fontSize: 14, color: "#94A3B8" }}>
                  {activeTab === "unseen"
                    ? "You're all caught up!"
                    : activeTab === "seen"
                      ? "No read messages yet"
                      : "No messages yet"}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                onPress={() => {
                  if (!isFetching) setPage((p) => p + 1);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 14,
                }}
              >
                {isFetching ? (
                  <Text style={{ fontSize: 13, color: "#7C3AED" }}>
                    Loading…
                  </Text>
                ) : (
                  <>
                    <AppIcon name="chevron-down" size={14} color="#7C3AED" />
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#7C3AED",
                        fontWeight: "600",
                      }}
                    >
                      Load more
                    </Text>
                  </>
                )}
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <NoticeCard
              item={item}
              openSwipeId={openSwipeId}
              onSwipeOpen={setOpenSwipeId}
            />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
