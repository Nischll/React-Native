import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  CommunicationItem,
  useCreateCommunicationWithRefresh,
  useDeleteCommunicationWithRefresh,
  useGetCommunications,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";

import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useState } from "react";
import { ReplyRow } from "./components/RepliesSheet";

interface ReplySheetProps {
  onBack?: () => void;
}

export function ReplySheet({ onBack }: ReplySheetProps) {
  const { parentItem } = useLocalSearchParams();
  const parsedParent: CommunicationItem = JSON.parse(parentItem as string);

  const parentId = parsedParent.id;

  const { data } = useGetCommunications();

  const parentFromServer = data?.data?.data?.find(
    (item) => item.id === parentId,
  );

  const replies = parentFromServer?.replies ?? [];

  const [replyText, setReplyText] = useState("");
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  const [editingReply, setEditingReply] = useState<CommunicationItem | null>(
    null,
  );
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { mutate: create, isPending: sending } =
    useCreateCommunicationWithRefresh();

  const { mutate: update, isPending: updating } =
    useUpdateCommunicationWithRefresh();

  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();

  const hasText = replyText.trim().length > 0;

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    // EDIT MODE
    if (editingReply) {
      update(
        {
          id: editingReply.id,
          message: trimmed,
          parentId: parentId,
        },
        {
          onSuccess: () => {
            setEditingReply(null);
            setReplyText("");
          },
        },
      );
      return;
    }

    // CREATE MODE
    create(
      {
        message: trimmed,
        parentId: parentId,
      },
      {
        onSuccess: () => {
          setReplyText("");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;

    deleteMsg(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null);
        setOpenSwipeId(null);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={{ flex: 1 }}>
        <PageHeader
          title={` ${replies.length === 1 ? "Reply" : "Replies"} ${replies.length > 0 ? `(${replies.length})` : ""}`}
          subtitle=""
          icon="chatbox"
          showBackButton
          onBack={() => router.replace("/(private)/(tabs)/updates")}
        />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* ORIGINAL POST */}
            <View
              style={{
                marginBottom: 12,
                padding: 12,
                backgroundColor: "#FAFAFA",
                borderRadius: 12,
                borderLeftWidth: 3,
                borderLeftColor: "#7C3AED",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#7C3AED",
                  marginBottom: 2,
                }}
              >
                {parsedParent.createdByFullName}
              </Text>

              <Text
                style={{ fontSize: 13, color: "#64748B", lineHeight: 18 }}
                numberOfLines={3}
              >
                {parsedParent.message}
              </Text>
            </View>

            {/* REPLIES */}
            <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 20 }}>
              <FlatList
                data={replies}
                keyExtractor={(item) => String(item.id)}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingTop: 4,
                  paddingBottom: 8,
                  gap: 8,
                  flexGrow: 1,
                }}
                renderItem={({ item }) => (
                  <ReplyRow
                    item={item}
                    openSwipeId={openSwipeId}
                    onSwipeOpen={setOpenSwipeId}
                    onRequestDelete={setDeleteTargetId}
                    onEdit={(r) => {
                      setEditingReply(r);
                      setReplyText(r.message);
                    }}
                  />
                )}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => setOpenSwipeId(null)}
                ListEmptyComponent={
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 32,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#94A3B8" }}>
                      No replies yet. Be the first!
                    </Text>
                  </View>
                }
              />
            </View>

            {/* MENTION */}
            {mentionState && (
              <MentionSuggestions
                mentionState={mentionState}
                value={replyText}
                onChangeText={setReplyText}
                onDismiss={() => setMentionState(null)}
                direction="above"
              />
            )}

            {/* EDIT INDICATOR */}
            {editingReply && (
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingBottom: 6,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#7C3AED",
                    fontWeight: "600",
                  }}
                >
                  Editing reply
                </Text>

                <Pressable
                  onPress={() => {
                    setEditingReply(null);
                    setReplyText("");
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}

            {/* INPUT */}
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: "#E2E8F0",
                backgroundColor: "white",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MentionTextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  onMentionStateChange={setMentionState}
                  placeholder={
                    editingReply
                      ? "Edit reply..."
                      : `Reply to ${parsedParent.createdByFullName ?? "post"}…`
                  }
                  placeholderTextColor="#CBD5E1"
                  multiline
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: "#1E293B",
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    borderRadius: 12,
                    padding: 10,
                    minHeight: 42,
                    maxHeight: 100,
                  }}
                />

                <Pressable
                  onPress={handleSend}
                  disabled={!hasText || sending}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    // backgroundColor:
                    //   hasText && !sending ? "#7C3AED" : "#E2E8F0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sending || updating ? (
                    <ActivityIndicator size="small" color="black" />
                  ) : (
                    <AppIcon
                      name="send"
                      size={18}
                      color={hasText ? "black" : "#94A3B8"}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* DELETE MODAL */}
        <ConfirmModal
          visible={deleteTargetId !== null}
          title="Delete Reply"
          message="This will permanently delete this reply."
          confirmText="Delete"
          destructive
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteTargetId(null);
            setOpenSwipeId(null);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
