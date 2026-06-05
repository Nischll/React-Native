import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useLocalSearchParams } from "expo-router";
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

export function ReplySheet() {
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
        <PageHeader title="Replies" subtitle="" icon="chatbox" showBackButton />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* ORIGINAL POST */}
            <View style={{ paddingHorizontal: 12 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: "#7C3AED" }}
              >
                {parsedParent.createdByFullName}
              </Text>

              <Text style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                {parsedParent.message}
              </Text>
            </View>

            {/* REPLIES */}
            <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 20 }}>
              <FlatList
                data={replies}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
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
                ListEmptyComponent={
                  <Text style={{ color: "#94A3B8", textAlign: "center" }}>
                    No replies yet
                  </Text>
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
                <Text style={{ color: "#7C3AED", fontSize: 12 }}>
                  Editing reply
                </Text>

                <Pressable
                  onPress={() => {
                    setEditingReply(null);
                    setReplyText("");
                  }}
                >
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>Cancel</Text>
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
                  placeholder="Write a reply..."
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
                    backgroundColor:
                      hasText && !sending ? "#7C3AED" : "#E2E8F0",
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
