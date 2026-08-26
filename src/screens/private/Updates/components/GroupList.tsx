import {
  communicationUnseenTotal,
  useGetCommunicationUnseenSummary,
} from "@/src/api/communication.api";
import EmptyState from "@/src/components/feedback/EmptyState";
import ListPager from "@/src/components/layout/ListPager";
import AppIcon from "@/src/components/ui/AppIcon";
import AppInput from "@/src/components/ui/AppInput";
import {
  CommunicationGroup,
  COMMUNICATION_GROUP_LIMIT,
} from "@/src/types/communication.types";
import { Pressable, ScrollView, Text, View } from "react-native";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`;
  return letters.toUpperCase() || "?";
}

function GroupRow({
  group,
  selected,
  onSelect,
}: {
  group: CommunicationGroup;
  selected: boolean;
  onSelect: (group: CommunicationGroup) => void;
}) {
  const isEveryone = group.id === "everyone";
  const buildingId = typeof group.id === "number" ? group.id : undefined;
  const { data } = useGetCommunicationUnseenSummary(buildingId, true);
  const unseen = communicationUnseenTotal(data?.data?.unseenCount);

  return (
    <Pressable
      onPress={() => onSelect(group)}
      className={`mx-2 mb-1 flex-row items-center gap-3 rounded-xl px-2.5 py-2.5 ${
        selected ? "bg-primary/10" : "bg-white"
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          selected
            ? "bg-primary"
            : isEveryone
              ? "bg-sky-100"
              : "bg-violet-100"
        }`}
      >
        {isEveryone ? (
          <AppIcon
            name="people-outline"
            size={16}
            color={selected ? "#fff" : "#0369A1"}
          />
        ) : (
          <Text
            className={`text-xs font-bold ${
              selected ? "text-white" : "text-violet-800"
            }`}
          >
            {initials(group.name)}
          </Text>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="flex-1 text-sm font-semibold text-textPrimary"
            numberOfLines={1}
          >
            {group.name}
          </Text>
          {unseen > 0 ? (
            <View className="min-w-[18px] items-center rounded-full bg-amber-500 px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-amber-950">
                {unseen > 99 ? "99+" : unseen}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-xs text-textSecondary" numberOfLines={1}>
          {isEveryone ? "All buildings you manage" : "Building group"}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GroupList({
  groups,
  selectedGroupId,
  search,
  page,
  total,
  onSearch,
  onSelect,
  onPageChange,
}: {
  groups: CommunicationGroup[];
  selectedGroupId: CommunicationGroup["id"] | null;
  search: string;
  page: number;
  total: number;
  onSearch: (value: string) => void;
  onSelect: (group: CommunicationGroup) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-slate-200 px-4 py-3">
        <Text className="mb-2 text-base font-semibold text-textPrimary">
          Groups
        </Text>
        <AppInput
          placeholder="Search groups…"
          value={search}
          onChangeText={onSearch}
          leftIcon="search-outline"
          size="sm"
        />
      </View>
      {groups.length === 0 ? (
        <EmptyState
          title="No groups match"
          message="Try a different search."
        />
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        >
          {groups.map((group) => (
            <GroupRow
              key={String(group.id)}
              group={group}
              selected={selectedGroupId === group.id}
              onSelect={onSelect}
            />
          ))}
        </ScrollView>
      )}
      <ListPager
        page={page}
        pageSize={COMMUNICATION_GROUP_LIMIT}
        total={total}
        onPageChange={onPageChange}
      />
    </View>
  );
}
