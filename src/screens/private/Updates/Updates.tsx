import {
  CommunicationItem,
  useGetCommunications,
} from "@/src/api/communication.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import LoadingState from "@/src/components/feedback/LoadingState";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import { NoticeCard } from "@/src/screens/private/Updates/components/NoticeCard";
import { NoticeComposer } from "@/src/screens/private/Updates/components/NoticeComposer";
import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

export default function Updates() {
  const [page, setPage] = useState(1);
  const limit = 5;
  const [allNotices, setAllNotices] = useState<CommunicationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Track which card (by id) is currently swiped open — only one at a time
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetCommunications(
    page,
    limit,
  );
  const notices = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const unseenCount = data?.data?.unseenCount ?? 0;

  useEffect(() => {
    if (page === 1) {
      setAllNotices(notices);
    } else {
      setAllNotices((prev) => [...prev, ...notices]);
    }
  }, [notices, page]);

  const hasMore = allNotices.length < total;

  const handleRefresh = async () => {
    setRefreshing(true);
    setOpenSwipeId(null); // close any open swipe on refresh
    setPage(1);
    setAllNotices([]);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) return <LoadingState message="Loading notices…" />;

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        icon="megaphone"
        title="Updates & Notices"
        subtitle={
          unseenCount > 0
            ? `${unseenCount} new update${unseenCount > 1 ? "s" : ""}`
            : "Stay in the loop with your team"
        }
      />

      <FlatList
        data={allNotices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingTop: 12,
          paddingBottom: 6,
        }}
        showsVerticalScrollIndicator={false}
        // Dismiss any open swipe when the list scrolls
        onScrollBeginDrag={() => setOpenSwipeId(null)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7C3AED"
            colors={["#7C3AED"]}
          />
        }
        ListHeaderComponent={<NoticeComposer />}
        ListEmptyComponent={
          <EmptyState
            title="No Notices Yet"
            message="Be the first to post an update for the team."
          />
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
                <Text style={{ fontSize: 13, color: "#7C3AED" }}>Loading…</Text>
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
  );
}
