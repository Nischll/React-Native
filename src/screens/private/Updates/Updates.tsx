import {
  useGetCommunications,
} from "@/src/api/communication.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import ListPager from "@/src/components/layout/ListPager";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import { useGlobalRefresh } from "@/src/hooks/useGlobalRefresh";
import { useAuth } from "@/src/providers/AuthProvider";
import CommunicationSeenFilter from "@/src/screens/private/Updates/components/CommunicationSeenFilter";
import GroupList from "@/src/screens/private/Updates/components/GroupList";
import { NoticeCard } from "@/src/screens/private/Updates/components/NoticeCard";
import { NoticeComposer } from "@/src/screens/private/Updates/components/NoticeComposer";
import {
  COMMUNICATION_GROUP_LIMIT,
  COMMUNICATION_PAGE_SIZE,
  CommunicationGroup,
  CommunicationItem,
  EVERYONE_GROUP,
  SeenStatus,
  getCommunicationBuildingIds,
  matchesCommunicationGroup,
} from "@/src/types/communication.types";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function matchesSearchQuery(query: string, ...values: Array<string | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return values.some((value) => (value ?? "").toLowerCase().includes(q));
}

export default function Updates() {
  const { user, buildingId } = useAuth();
  const { width } = useWindowDimensions();
  const split = width >= 720;
  const { setUnseenUpdatesCount } = useGlobalRefresh();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<CommunicationGroup | null>(
    null,
  );
  const [groupPage, setGroupPage] = useState(1);
  const [page, setPage] = useState(1);
  const [seenStatus, setSeenStatus] = useState<SeenStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommunicationItem | null>(
    null,
  );

  const managedBuildings = user?.buildingList ?? [];
  const buildingGroups = useMemo<CommunicationGroup[]>(
    () =>
      managedBuildings
        .map((building) => ({
          id: Number(building.value),
          name: building.label,
        }))
        .filter(
          (group): group is CommunicationGroup & { id: number } =>
            typeof group.id === "number" &&
            Number.isFinite(group.id) &&
            group.id > 0,
        ),
    [managedBuildings],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setGroupPage(1);
  }, [debouncedSearch]);

  const everyoneVisible =
    !debouncedSearch ||
    matchesSearchQuery(debouncedSearch, EVERYONE_GROUP.name, "all buildings");

  const filteredBuildingGroups = useMemo(() => {
    if (!debouncedSearch) return buildingGroups;
    return buildingGroups.filter((group) =>
      matchesSearchQuery(debouncedSearch, group.name),
    );
  }, [buildingGroups, debouncedSearch]);

  const sidebarGroups = useMemo(
    () =>
      everyoneVisible
        ? [EVERYONE_GROUP, ...filteredBuildingGroups]
        : filteredBuildingGroups,
    [everyoneVisible, filteredBuildingGroups],
  );

  const groupTotalPages = Math.max(
    1,
    Math.ceil(sidebarGroups.length / COMMUNICATION_GROUP_LIMIT) || 1,
  );
  const pagedGroups = useMemo(() => {
    const start = (groupPage - 1) * COMMUNICATION_GROUP_LIMIT;
    return sidebarGroups.slice(start, start + COMMUNICATION_GROUP_LIMIT);
  }, [sidebarGroups, groupPage]);

  useEffect(() => {
    if (groupPage > groupTotalPages) setGroupPage(groupTotalPages);
  }, [groupPage, groupTotalPages]);

  const isEveryoneGroup = selectedGroup?.id === "everyone";
  const activeBuildingId =
    typeof selectedGroup?.id === "number" ? selectedGroup.id : undefined;
  const mentionBuildingId =
    activeBuildingId ??
    buildingId ??
    (typeof buildingGroups[0]?.id === "number" ? buildingGroups[0].id : null);

  const { data, isLoading, isFetching, refetch } = useGetCommunications(
    page,
    COMMUNICATION_PAGE_SIZE,
    seenStatus,
    activeBuildingId,
    selectedGroup != null,
  );

  const notices = useMemo(() => {
    const rows = data?.data?.data ?? [];
    if (!selectedGroup) return [];
    const groupId = selectedGroup.id;
    return rows
      .map((item) => ({
        ...item,
        buildingIds: getCommunicationBuildingIds(item),
      }))
      .filter((item) => matchesCommunicationGroup(item, groupId));
  }, [data, selectedGroup]);
  const total = data?.data?.total ?? 0;
  const unseenCount = data?.data?.unseenCount ?? 0;
  const seenCount = data?.data?.seenCount ?? 0;
  const replyUnseenCount = data?.data?.replyUnseenCount ?? 0;
  const totalAll = seenCount + unseenCount;

  useEffect(() => {
    setUnseenUpdatesCount(unseenCount);
  }, [unseenCount, setUnseenUpdatesCount]);

  useEffect(() => {
    setPage(1);
    setOpenSwipeId(null);
  }, [selectedGroup?.id]);

  useEffect(() => {
    if (isFetching) return;
    if (notices.length === 0 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    }
  }, [isFetching, notices.length, page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setOpenSwipeId(null);
    await refetch();
    setRefreshing(false);
  };

  const openComposer = (item: CommunicationItem | null = null) => {
    setEditingItem(item);
    setComposerOpen(true);
  };

  const listPane = (
    <View
      className={`${split ? "w-[38%] border-r border-slate-200" : "flex-1"} bg-white`}
    >
      <GroupList
        groups={pagedGroups}
        selectedGroupId={selectedGroup?.id ?? null}
        search={search}
        page={groupPage}
        total={sidebarGroups.length}
        onSearch={setSearch}
        onSelect={setSelectedGroup}
        onPageChange={setGroupPage}
      />
    </View>
  );

  const feedPane = selectedGroup ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-row items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {!split ? (
            <Pressable
              onPress={() => setSelectedGroup(null)}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <AppIcon name="arrow-back" size={16} color="#453956" />
            </Pressable>
          ) : null}
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${
              isEveryoneGroup ? "bg-sky-100" : "bg-violet-100"
            }`}
          >
            {isEveryoneGroup ? (
              <AppIcon name="people-outline" size={16} color="#0369A1" />
            ) : (
              <AppIcon name="business-outline" size={16} color="#6D28D9" />
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="text-sm font-semibold text-textPrimary"
              numberOfLines={1}
            >
              {selectedGroup.name}
            </Text>
            <Text className="text-[11px] text-textSecondary" numberOfLines={1}>
              {isEveryoneGroup
                ? "Broadcasts with no building selected"
                : "This building only"}
            </Text>
          </View>
        </View>
        <View>
          <AppButton
            size="sm"
            fullWidth={false}
            leftIcon="add"
            onPress={() => openComposer(null)}
          >
            Add message
          </AppButton>
        </View>
      </View>

      <View className="px-3 pt-3">
        <CommunicationSeenFilter
          value={seenStatus}
          onChange={(next) => {
            setSeenStatus(next);
            setPage(1);
          }}
          totalCount={totalAll}
          seenCount={seenCount}
          unseenCount={unseenCount}
          replyUnseenCount={replyUnseenCount}
          disabled={isLoading}
        />
      </View>

      <FlatList
        data={notices}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setOpenSwipeId(null)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6 py-16">
              <AppIcon name="chatbubbles-outline" size={40} color="#CBD5E1" />
              <Text className="mt-3 text-sm font-semibold text-textPrimary">
                No threads yet
              </Text>
              <Text className="mt-1 text-center text-xs text-textSecondary">
                Post a building-wide broadcast. Private chats stay in Private
                Messages.
              </Text>
              <View className="mt-4">
                <AppButton
                  size="sm"
                  fullWidth={false}
                  leftIcon="add"
                  onPress={() => openComposer(null)}
                >
                  Add message
                </AppButton>
              </View>
            </View>
          )
        }
        extraData={`${selectedGroup.id}-${notices.length}`}
        renderItem={({ item }) => (
          <NoticeCard
            item={item}
            openSwipeId={openSwipeId}
            onSwipeOpen={setOpenSwipeId}
            onEdit={openComposer}
            currentUserEmail={user?.email}
            mentionBuildingId={mentionBuildingId}
          />
        )}
      />

      <ListPager
        page={page}
        pageSize={COMMUNICATION_PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </KeyboardAvoidingView>
  ) : (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <AppIcon name="chatbubbles-outline" size={48} color="#CBD5E1" />
      <Text className="mt-3 text-sm font-semibold text-textPrimary">
        Select a group to view messages
      </Text>
      <Text className="mt-1 max-w-sm text-center text-xs text-textSecondary">
        Choose Everyone or one of your assigned buildings to filter this feed.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {split || !selectedGroup ? (
        <View className="px-4 pt-1">
          <PageHeader
            icon="chatbubbles"
            title="Communications"
            subtitle="Building-wide broadcasts. Private chats stay in Private Messages."
          />
        </View>
      ) : null}

      {split ? (
        <View className="min-h-0 flex-1 flex-row">
          {listPane}
          {feedPane}
        </View>
      ) : selectedGroup ? (
        <View className="min-h-0 flex-1">{feedPane}</View>
      ) : (
        <View className="min-h-0 flex-1">{listPane}</View>
      )}

      <NoticeComposer
        visible={composerOpen}
        selectedGroup={selectedGroup}
        editingItem={editingItem}
        mentionBuildingId={mentionBuildingId}
        onSaved={() => setPage(1)}
        onClose={() => {
          setComposerOpen(false);
          setEditingItem(null);
        }}
      />
    </View>
  );
}
