import EmptyState from "@/src/components/feedback/EmptyState";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import ListPager from "@/src/components/layout/ListPager";
import AppIcon from "@/src/components/ui/AppIcon";
import { PrivateInboxItem } from "@/src/types/privateMessage.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { Pressable, Text, View } from "react-native";

export default function ConversationList({
  items,
  loading,
  selectedUserId,
  page,
  pageSize,
  total,
  onSelect,
  onPageChange,
}: {
  items: PrivateInboxItem[];
  loading: boolean;
  selectedUserId: number | null;
  page: number;
  pageSize: number;
  total: number;
  onSelect: (item: PrivateInboxItem) => void;
  onPageChange: (page: number) => void;
}) {
  if (loading && items.length === 0) {
    return (
      <View className="px-1 pt-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return <EmptyState title="" message="No conversations yet" />;
  }

  return (
    <View className="flex-1">
      <View className="flex-1">
        {items.map((item) => {
          const selected = selectedUserId === item.userId;
          return (
            <Pressable
              key={item.userId}
              onPress={() => onSelect(item)}
              className={`px-3 py-3 border-b border-slate-100 ${
                selected ? "bg-primary/10" : "bg-white"
              }`}
            >
              <View className="flex-row items-start">
                <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <AppIcon name="person" size={18} color="#453956" />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      className="text-sm font-bold text-textPrimary flex-1"
                      numberOfLines={1}
                    >
                      {item.fullName || item.email}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {item.lastMessageAt ? timeAgo(item.lastMessageAt) : ""}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-0.5 gap-2">
                    <Text
                      className="flex-1 text-xs text-textSecondary"
                      numberOfLines={1}
                    >
                      {item.lastMessage || "No messages yet"}
                    </Text>
                    {item.unreadCount > 0 ? (
                      <View className="min-w-[18px] h-[18px] rounded-full bg-danger items-center justify-center px-1">
                        <Text className="text-[10px] font-bold text-white">
                          {item.unreadCount > 99 ? "99+" : item.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <ListPager
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </View>
  );
}
