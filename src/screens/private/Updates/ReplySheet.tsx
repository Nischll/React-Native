import {
  CommunicationItem,
  useCreateCommunicationWithRefresh,
  useDeleteCommunicationWithRefresh,
  useGetCommunications,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import PageHeader from "@/src/components/layout/PageHeader";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReplyRow } from "./components/ReplyRow";

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

    if (editingReply) {
      update(
        { id: editingReply.id, message: trimmed, parentId },
        {
          onSuccess: () => {
            setEditingReply(null);
            setReplyText("");
          },
        },
      );
      return;
    }
    create(
      { message: trimmed, parentId },
      { onSuccess: () => setReplyText("") },
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
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-white p-4"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* ── Header — never moves ── */}
      <PageHeader
        title={`${replies.length <= 1 ? "Reply" : "Replies"}${replies.length > 0 ? ` (${replies.length})` : ""}`}
        subtitle=""
        icon="chatbox"
        showBackButton
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(private)/(tabs)/(updates)");
          }
        }}
      />

      {/* ── Original post — never moves ── */}
      <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        <View
          style={{
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
      </View>

      {/* ── Reply list — shrinks when keyboard opens ── */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <FlatList
            data={replies}
            keyExtractor={(item) => String(item.id)}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 8,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setOpenSwipeId(null)}
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
      </TouchableWithoutFeedback>

      {/* ── Mention suggestions ── */}
      {mentionState && (
        <MentionSuggestions
          mentionState={mentionState}
          value={replyText}
          onChangeText={setReplyText}
          onDismiss={() => setMentionState(null)}
          direction="above"
        />
      )}

      {/* ── Edit indicator ── */}
      {editingReply && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 6,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}>
            Editing reply
          </Text>
          <Pressable
            onPress={() => {
              setEditingReply(null);
              setReplyText("");
            }}
          >
            <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "600" }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Pinned composer ── */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          backgroundColor: "#fff",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                color={hasText ? "#7C3AED" : "#94A3B8"}
              />
            )}
          </Pressable>
        </View>
      </View>

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
    </SafeAreaView>
  );
}
