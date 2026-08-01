import {
  useDeleteNotice,
  useEditNotice,
  useGetNotice,
  usePostNotice,
} from "@/src/api/activity.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import AnimatedPressable from "@/src/components/ui/AnimatedPressable";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { Notice } from "@/src/types/dashboard.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  NoticeReactionBar,
  NoticeReactionPicker,
} from "./components/NoticeReactionBar";

type Filter = "all" | "unseen" | "seen";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unseen", label: "Unseen" },
  { key: "seen", label: "Seen" },
];

const PAGE_SIZE = 10;

export function NoticesTab() {
  const { user } = useAuth();
  const isAdmin = user?.roleList?.some(
    (r) => r.code === "SuperAdmin" || r.code === "Admin",
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const noticesMapRef = useRef<Map<number, Notice>>(new Map());
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pendingResetRef = useRef(false);

  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const [composing, setComposing] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [openPickerId, setOpenPickerId] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetNotice(
    page,
    PAGE_SIZE,
    filter,
  );

  const notices = data?.data?.data ?? [];
  const unseenCount = data?.data?.unseenCount ?? 0;
  const seenCount = data?.data?.seenCount ?? 0;

  useEffect(() => {
    if (!data?.data) return;

    const { total, page: responsePage, limit } = data.data;

    if (responsePage !== pageRef.current) return;

    if (responsePage === 1 || pendingResetRef.current) {
      pendingResetRef.current = false;
      noticesMapRef.current = new Map(notices.map((n) => [n.id, n]));
    } else {
      notices.forEach((n) => noticesMapRef.current.set(n.id, n));
    }

    setAllNotices(Array.from(noticesMapRef.current.values()));

    const tabTotal =
      filterRef.current === "seen"
        ? (data.data.seenCount ?? 0)
        : filterRef.current === "unseen"
          ? (data.data.unseenCount ?? 0)
          : total;

    setHasMore(responsePage * limit < tabTotal);
  }, [data]);

  const { mutate: postNotice, isPending: posting } = usePostNotice();
  const { mutate: editNotice, isPending: editing } = useEditNotice(
    editingNotice?.id,
  );
  const { mutate: deleteNotice, isPending: deleting } = useDeleteNotice(
    deleteTargetId ?? undefined,
  );

  const resetAndRefetch = useCallback(() => {
    pendingResetRef.current = true;
    noticesMapRef.current = new Map();

    if (pageRef.current !== 1) {
      setPage(1);
    } else {
      refetch();
    }
  }, [refetch]);

  const handleFilterChange = useCallback((newFilter: Filter) => {
    if (newFilter === filterRef.current) return;
    pendingResetRef.current = true;
    noticesMapRef.current = new Map();
    setAllNotices([]);
    setHasMore(true);
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handlePost = () => {
    const trimmed = composeText.trim();
    if (!trimmed) return;
    postNotice(
      { message: trimmed },
      {
        onSuccess: () => {
          setComposeText("");
          setComposing(false);
          resetAndRefetch();
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || !editingNotice) return;
    editNotice(
      { message: trimmed },
      {
        onSuccess: () => {
          setEditingNotice(null);
          setEditText("");
          resetAndRefetch();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteNotice(undefined, {
      onSuccess: () => {
        setDeleteTargetId(null);
        resetAndRefetch();
      },
    });
  };

  const handleRefresh = useCallback(() => {
    resetAndRefetch();
  }, [resetAndRefetch]);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((p) => p + 1);
    }
  }, [isFetching, hasMore]);

  const renderNotice = ({ item: notice }: { item: Notice }) => {
    const isEditing = editingNotice?.id === notice.id;
    const isPickerOpen = openPickerId === notice.id;

    return (
      <View
        className="bg-white rounded-xl border mx-4 mb-3 p-3"
        style={{ borderColor: notice.seen ? "#E2E8F0" : "#FAC775" }}
      >
        {isEditing ? (
          <View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              className="text-sm text-textPrimary border-b border-amber-200 pb-2 min-h-[50px]"
            />
            <View className="flex-row justify-end gap-4 mt-2">
              <Pressable
                onPress={() => {
                  setEditingNotice(null);
                  setEditText("");
                }}
              >
                <Text className="text-sm font-semibold text-slate-400">
                  Cancel
                </Text>
              </Pressable>
              <Pressable onPress={handleEdit} disabled={editing}>
                <Text className="text-sm font-bold text-amber-700">
                  {editing ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View className="flex-row items-start justify-between gap-2">
              {!notice.seen && (
                <View className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              )}
              <Text
                className="flex-1 text-sm font-medium text-textPrimary"
                style={{ opacity: notice.seen ? 0.6 : 1 }}
              >
                {notice.message}
              </Text>
              {isAdmin && (
                <View className="flex-row gap-3 pt-0.5">
                  <Pressable
                    onPress={() => {
                      setEditingNotice(notice);
                      setEditText(notice.message);
                    }}
                    hitSlop={8}
                  >
                    <AppIcon name="pencil-outline" size={14} color="#BA7517" />
                  </Pressable>
                  <Pressable
                    onPress={() => setDeleteTargetId(notice.id)}
                    hitSlop={8}
                  >
                    <AppIcon name="trash-outline" size={14} color="#EF4444" />
                  </Pressable>
                </View>
              )}
            </View>

            <Text
              className="text-[11px] mt-1.5"
              style={{ color: notice.seen ? "#94A3B8" : "#BA7517" }}
            >
              {notice.createdByFullName} · {timeAgo(notice.createdDate)}
            </Text>

            {/* ── Reaction bar ── */}
            <NoticeReactionBar
              noticeId={notice.id}
              reactions={notice.reactions}
              onOpenPicker={() =>
                setOpenPickerId((prev) =>
                  prev === notice.id ? null : notice.id,
                )
              }
            />

            {/* ── Inline emoji picker (toggles per card) ── */}
            {isPickerOpen && (
              <NoticeReactionPicker
                noticeId={notice.id}
                onClose={() => setOpenPickerId(null)}
              />
            )}
          </>
        )}
      </View>
    );
  };

  const isInitialLoad = isLoading && allNotices.length === 0;

  return (
    <View className="flex-1">
      {/* Filter chips */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => handleFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === f.key
                ? "bg-primary border-primary"
                : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filter === f.key ? "text-white" : "text-textSecondary"
              }`}
            >
              {f.label}
              {f.key === "unseen" && unseenCount > 0
                ? ` (${unseenCount})`
                : f.key === "seen" && seenCount > 0
                  ? ` (${seenCount})`
                  : ""}
            </Text>
          </Pressable>
        ))}

        {isAdmin && (
          <AnimatedPressable
            onPress={() => setComposing((v) => !v)}
            className="ml-auto"
          >
            <View
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
                composing ? "bg-amber-200" : "bg-amber-600"
              }`}
            >
              <AppIcon
                name={composing ? "close" : "add"}
                size={12}
                color="#fff"
              />
              <Text className="text-xs font-bold text-white">
                {composing ? "Cancel" : "Post"}
              </Text>
            </View>
          </AnimatedPressable>
        )}
      </View>

      {/* Compose box */}
      {composing && isAdmin && (
        <View className="mx-4 mb-3 bg-white rounded-xl border border-amber-300 p-3">
          <TextInput
            value={composeText}
            onChangeText={setComposeText}
            placeholder="Write a notice…"
            placeholderTextColor="#CBD5E1"
            multiline
            autoFocus
            className="text-sm text-textPrimary min-h-[60px] max-h-[120px]"
          />
          <Pressable
            onPress={handlePost}
            disabled={!composeText.trim() || posting}
            className="self-end mt-2 flex-row items-center gap-1.5 px-4 py-1.5 rounded-lg"
            style={{
              backgroundColor:
                !composeText.trim() || posting ? "#E2E8F0" : "#BA7517",
            }}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppIcon
                name="send"
                size={12}
                color={!composeText.trim() ? "#94A3B8" : "#fff"}
              />
            )}
            <Text
              className="text-sm font-bold"
              style={{
                color: !composeText.trim() || posting ? "#94A3B8" : "#fff",
              }}
            >
              {posting ? "Posting…" : "Post"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Notice list */}
      {isInitialLoad ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : allNotices.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <AppIcon name="megaphone-outline" size={36} color="#CBD5E1" />
          <Text className="text-sm text-slate-400">
            {filter === "unseen"
              ? "No unseen notices"
              : filter === "seen"
                ? "No seen notices"
                : "No notices yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={allNotices}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotice}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1}
              onRefresh={handleRefresh}
            />
          }
          ListFooterComponent={
            isFetching ? (
              page > 1 ? (
                <ActivityIndicator
                  size="small"
                  color="#BA7517"
                  style={{ marginVertical: 12 }}
                />
              ) : null
            ) : hasMore ? (
              <Pressable
                onPress={handleLoadMore}
                className="mx-4 mb-4 py-3 rounded-xl border border-gray-200 bg-white items-center"
              >
                <Text className="text-xs font-semibold text-textSecondary">
                  Load more
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}

      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete notice"
        message="This will permanently delete this notice."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}
