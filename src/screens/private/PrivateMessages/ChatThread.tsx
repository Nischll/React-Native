import EmptyState from "@/src/components/feedback/EmptyState";
import ListPager from "@/src/components/layout/ListPager";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import { PrivateThreadMessage } from "@/src/types/privateMessage.types";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import MessageBubble from "./MessageBubble";

export default function ChatThread({
  title,
  messages,
  loading,
  page,
  pageSize,
  total,
  loggedInUserId,
  draft,
  sending,
  sendDisabled,
  showBack,
  onBack,
  onChangeDraft,
  onSend,
  onPageChange,
  onDelete,
}: {
  title: string;
  messages: PrivateThreadMessage[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  loggedInUserId: number;
  draft: string;
  sending: boolean;
  sendDisabled: boolean;
  showBack: boolean;
  onBack: () => void;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onPageChange: (page: number) => void;
  onDelete: (item: PrivateThreadMessage) => void;
}) {
  const ordered = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
      ),
    [messages],
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View className="flex-row items-center border-b border-slate-200 px-3 py-3">
        {showBack ? (
          <Pressable
            onPress={onBack}
            className="h-9 w-9 mr-1 items-center justify-center rounded-full bg-slate-100"
          >
            <AppIcon name="chevron-back" size={18} color="#334155" />
          </Pressable>
        ) : null}
        <View className="h-9 w-9 rounded-full bg-primary/10 items-center justify-center mr-2">
          <AppIcon name="person" size={16} color="#453956" />
        </View>
        <Text
          className="flex-1 text-base font-bold text-textPrimary"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {loading && ordered.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#453956" />
        </View>
      ) : ordered.length === 0 ? (
        <View className="flex-1">
          <EmptyState message="No messages yet. Say hello." />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={ordered}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              isMine={item.createdBy === loggedInUserId}
              onDelete={
                item.createdBy === loggedInUserId ? onDelete : undefined
              }
            />
          )}
        />
      )}

      {totalPages > 1 ? (
        <ListPager
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      ) : null}

      <View className="flex-row items-end gap-2 border-t border-slate-200 px-3 pt-2 pb-3">
        <TextInput
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Type a message"
          placeholderTextColor="#94A3B8"
          multiline
          className="flex-1 max-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-textPrimary"
        />
        <View className="mb-1">
          <AppButton
            size="sm"
            fullWidth={false}
            disabled={sendDisabled}
            loading={sending}
            onPress={onSend}
          >
            Send
          </AppButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
