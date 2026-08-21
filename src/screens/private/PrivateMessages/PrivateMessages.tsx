import {
  useDeletePrivateMessage,
  useGetPrivateInbox,
  useGetPrivateThread,
  useMarkPrivateMessageSeen,
  useSearchPrivateUsers,
  useSendPrivateMessage,
} from "@/src/api/privateMessage.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppButton from "@/src/components/ui/AppButton";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  PRIVATE_INBOX_LIMIT,
  PRIVATE_THREAD_LIMIT,
  PRIVATE_USER_PICKER_LIMIT,
  PrivateThreadMessage,
  PrivateUserOption,
} from "@/src/types/privateMessage.types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import ChatThread from "./ChatThread";
import ConversationList from "./ConversationList";
import UserPickerSheet from "./UserPickerSheet";

export default function PrivateMessages() {
  const { user } = useAuth();
  const loggedInUserId = user?.userId ?? 0;
  const { width } = useWindowDimensions();
  const split = width >= 720;

  const [inboxPage, setInboxPage] = useState(1);
  const [selected, setSelected] = useState<{
    userId: number;
    fullName: string;
  } | null>(null);
  const [threadPage, setThreadPage] = useState(1);
  const [messages, setMessages] = useState<PrivateThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PrivateThreadMessage | null>(
    null,
  );
  const markedSeen = useRef(new Set<number>());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    setUserPage(1);
  }, [debouncedSearch]);

  const inboxQuery = useGetPrivateInbox(inboxPage, PRIVATE_INBOX_LIMIT);
  const threadQuery = useGetPrivateThread(
    selected?.userId ?? null,
    threadPage,
    PRIVATE_THREAD_LIMIT,
  );
  const sendMutation = useSendPrivateMessage();
  const deleteMutation = useDeletePrivateMessage();
  const seenMutation = useMarkPrivateMessageSeen();
  const usersQuery = useSearchPrivateUsers(
    userPage,
    PRIVATE_USER_PICKER_LIMIT,
    debouncedSearch,
    pickerOpen,
  );

  const inboxPayload = inboxQuery.data?.data;
  const threadPayload = threadQuery.data?.data;
  const inboxItems = inboxPayload?.data ?? [];
  const inboxTotal = inboxPayload?.total ?? inboxItems.length;
  const threadTotal = threadPayload?.total ?? 0;

  useEffect(() => {
    if (!selected) return;
    if (
      threadPayload?.otherUserId != null &&
      threadPayload.otherUserId !== selected.userId
    ) {
      return;
    }
    const rows = threadPayload?.data ?? [];
    if (
      threadPayload?.page != null &&
      Number(threadPayload.page) !== threadPage
    ) {
      return;
    }
    if (
      threadPayload?.otherUserFullName &&
      selected.fullName !== threadPayload.otherUserFullName
    ) {
      setSelected((cur) =>
        cur && cur.userId === selected.userId
          ? { ...cur, fullName: threadPayload.otherUserFullName }
          : cur,
      );
    }
    setMessages(rows);
  }, [threadPayload, threadPage, selected]);

  useEffect(() => {
    if (!selected || !loggedInUserId) return;
    for (const msg of messages) {
      if (
        msg.createdBy === loggedInUserId ||
        msg.seen ||
        markedSeen.current.has(msg.id)
      ) {
        continue;
      }
      markedSeen.current.add(msg.id);
      seenMutation.mutate({
        communicationId: msg.id,
        reactionType: "SEEN",
      });
    }
  }, [messages, selected, loggedInUserId]);

  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => {
        void inboxQuery.refetch();
        if (selected?.userId) void threadQuery.refetch();
      }, 10000);
      return () => clearInterval(id);
    }, [
      inboxQuery.refetch,
      threadQuery.refetch,
      selected?.userId,
      threadPage,
    ]),
  );

  const openConversation = (item: { userId: number; fullName: string }) => {
    if (selected?.userId === item.userId) return;
    setSelected(item);
    setThreadPage(1);
    setMessages([]);
    setDraft("");
    markedSeen.current = new Set();
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !selected) return;
    sendMutation.mutate(
      { otherUserId: selected.userId, message: text },
      {
        onSuccess: () => {
          setDraft("");
          setThreadPage(1);
          void threadQuery.refetch();
          void inboxQuery.refetch();
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.createdBy !== loggedInUserId) {
      setDeleteTarget(null);
      return;
    }
    deleteMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
          setDeleteTarget(null);
          void inboxQuery.refetch();
        },
      },
    );
  };

  const pickerUsers: PrivateUserOption[] = useMemo(() => {
    const payload = usersQuery.data?.data;
    const rows = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && Array.isArray(payload.data)
        ? payload.data
        : [];
    const inboxIds = new Set(inboxItems.map((i) => i.userId));
    return rows
      .filter((row) => row.id !== loggedInUserId && !inboxIds.has(row.id))
      .map((row) => ({
        userId: row.id,
        fullName:
          [row.firstName, row.middleName, row.lastName]
            .filter((p) => p && p.trim() && p.trim() !== "-")
            .join(" ") ||
          row.username ||
          row.email,
        email: row.email,
      }));
  }, [usersQuery.data, inboxItems, loggedInUserId]);

  const pickerTotal = useMemo(() => {
    const payload = usersQuery.data?.data;
    if (payload && !Array.isArray(payload) && typeof payload.total === "number") {
      return payload.total;
    }
    return pickerUsers.length;
  }, [usersQuery.data, pickerUsers.length]);

  const listPane = (
    <View
      className={`${split ? "w-[38%] border-r border-slate-200" : "flex-1"} bg-white`}
    >
      <View className="px-3 pt-1 pb-2">
        <AppButton
          size="sm"
          leftIcon="create-outline"
          onPress={() => {
            setUserSearch("");
            setUserPage(1);
            setPickerOpen(true);
          }}
        >
          New message
        </AppButton>
      </View>
      <ConversationList
        items={inboxItems}
        loading={inboxQuery.isLoading}
        selectedUserId={selected?.userId ?? null}
        page={inboxPage}
        pageSize={PRIVATE_INBOX_LIMIT}
        total={inboxTotal}
        onSelect={(item) =>
          openConversation({ userId: item.userId, fullName: item.fullName })
        }
        onPageChange={setInboxPage}
      />
    </View>
  );

  const threadPane = selected ? (
    <View className="flex-1">
      <ChatThread
        title={selected.fullName}
        messages={messages}
        loading={threadQuery.isFetching}
        page={threadPage}
        pageSize={PRIVATE_THREAD_LIMIT}
        total={threadTotal}
        loggedInUserId={loggedInUserId}
        draft={draft}
        sending={sendMutation.isPending}
        sendDisabled={!draft.trim() || sendMutation.isPending}
        showBack={!split}
        onBack={() => {
          setSelected(null);
          setMessages([]);
          setThreadPage(1);
          setDraft("");
        }}
        onChangeDraft={setDraft}
        onSend={handleSend}
        onPageChange={setThreadPage}
        onDelete={(item) => {
          if (item.createdBy !== loggedInUserId) return;
          setDeleteTarget(item);
        }}
      />
    </View>
  ) : (
    <View className="flex-1 items-center justify-center px-6 bg-slate-50">
      <Text className="text-sm text-center text-textSecondary">
        Select a person to start chatting
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {split || !selected ? (
        <View className="px-4 pt-1">
          <PageHeader
            icon="chatbubble-ellipses-outline"
            title="Private Messages"
            subtitle="Direct messages with one person"
          />
        </View>
      ) : null}

      {split ? (
        <View className="flex-1 flex-row min-h-0">
          {listPane}
          {threadPane}
        </View>
      ) : selected ? (
        <View className="flex-1 min-h-0">{threadPane}</View>
      ) : (
        <View className="flex-1 min-h-0">{listPane}</View>
      )}

      <UserPickerSheet
        visible={pickerOpen}
        search={userSearch}
        users={pickerUsers}
        loading={usersQuery.isFetching}
        page={userPage}
        pageSize={PRIVATE_USER_PICKER_LIMIT}
        total={pickerTotal}
        onChangeSearch={setUserSearch}
        onPageChange={setUserPage}
        onClose={() => setPickerOpen(false)}
        onSelect={(person) => {
          setPickerOpen(false);
          openConversation({
            userId: person.userId,
            fullName: person.fullName,
          });
        }}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete message"
        message="Delete this message? Only you can delete messages you sent."
        confirmText="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}
