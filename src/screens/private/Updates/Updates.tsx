import {
  CommunicationItem,
  useGetCommunications,
} from "@/src/api/communication.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import { NoticeCard } from "@/src/screens/private/Updates/components/NoticeCard";
import { NoticeComposer } from "@/src/screens/private/Updates/components/NoticeComposer";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function Updates() {
  const [page, setPage] = useState(1);
  const limit = 5;
  const [allNotices, setAllNotices] = useState<CommunicationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);

  const isResetRef = useRef(false);

  const { data, isLoading, isFetching, refetch } = useGetCommunications(
    page,
    limit,
  );
  const notices = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const unseenCount = data?.data?.unseenCount ?? 0;

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
  const hasMore = allNotices.length > 0 && allNotices.length < total;

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
          // paddingTop: 12,
          paddingBottom: 6,
        }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setOpenSwipeId(null)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            // tintColor="#7C3AED"
            // colors={["#7C3AED"]}
          />
        }
        ListHeaderComponent={<NoticeComposer />}
        ListEmptyComponent={
          !isLoading ? (
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
          ) : null
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
