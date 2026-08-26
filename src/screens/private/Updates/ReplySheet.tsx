import {
  COMMUNICATION_KEY,
  buildReplyTree,
  findCommunicationInCache,
  getReplyCount,
  useCreateCommunicationWithRefresh,
  useDeleteCommunicationWithRefresh,
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
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommunicationItem } from "@/src/types/communication.types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReplyRow } from "./components/ReplyRow";

export function ReplySheet() {
  const {
    parentId: parentIdParam,
    author,
    message,
    mentionBuildingId: mentionBuildingIdParam,
  } = useLocalSearchParams<{
    parentId?: string;
    author?: string;
    message?: string;
    mentionBuildingId?: string;
  }>();
  const parentId = Number(parentIdParam);
  const mentionBuildingId = Number(mentionBuildingIdParam);
  const { user } = useAuth();
  const qc = useQueryClient();

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      qc.getQueryCache().subscribe((event) => {
        if (event?.query?.queryKey?.[0] === COMMUNICATION_KEY) onStoreChange();
      }),
    [qc],
  );
  const getSnapshot = useCallback(
    () => (parentId ? findCommunicationInCache(qc, parentId) ?? null : null),
    [qc, parentId],
  );
  const cachedParent = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const parentAuthor = cachedParent?.createdByFullName || String(author ?? "");
  const parentMessage = cachedParent?.message || String(message ?? "");
  const parentIsOwn = user?.userId != null && cachedParent?.createdBy === user.userId;
  const replies = useMemo(
    () =>
      buildReplyTree(
        parentId,
        Array.isArray(cachedParent?.replies) ? cachedParent.replies : [],
      ),
    [cachedParent, parentId],
  );
  const replyCount = cachedParent ? getReplyCount(cachedParent) : replies.length;

  const [replyText, setReplyText] = useState("");
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [editingReply, setEditingReply] = useState<CommunicationItem | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<CommunicationItem | null>(null);
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
    if (!trimmed || !parentId) return;

    if (editingReply) {
      update(
        {
          id: editingReply.id,
          message: trimmed,
          parentId: editingReply.parentId ?? parentId,
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
    create(
      { message: trimmed, parentId: replyingTo?.id ?? parentId },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyingTo(null);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteMsg(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null);
      },
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-white"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <PageHeader
        title={`${replyCount <= 1 ? "Reply" : "Replies"}${replyCount > 0 ? ` (${replyCount})` : ""}`}
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

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View
          style={{
            padding: 12,
            backgroundColor: parentIsOwn ? "#F8F5FF" : "#F8FAFC",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: parentIsOwn ? "#DDD6FE" : "#E2E8F0",
            borderLeftWidth: 4,
            borderLeftColor: parentIsOwn ? "#453956" : "#94A3B8",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: parentIsOwn ? "#5B21B6" : "#0F172A",
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {parentIsOwn ? "You" : parentAuthor}
            </Text>
            <View
              style={{
                borderRadius: 99,
                paddingHorizontal: 6,
                paddingVertical: 1,
                backgroundColor: parentIsOwn ? "#EDE9FE" : "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  color: parentIsOwn ? "#5B21B6" : "#64748B",
                }}
              >
                {parentIsOwn ? "ORIGINAL · SENT" : "ORIGINAL"}
              </Text>
            </View>
          </View>
          <MessageText
            text={parentMessage}
            currentUserEmail={user?.email}
            textStyle={{ fontSize: 13, color: "#64748B", lineHeight: 18 }}
          />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={replies}
          keyExtractor={(item) => String(item.id)}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          windowSize={5}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            gap: 8,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ReplyRow
              item={item}
              onRequestDelete={setDeleteTargetId}
              currentUserEmail={user?.email}
              mentionBuildingId={
                Number.isFinite(mentionBuildingId) ? mentionBuildingId : null
              }
              onEdit={(r) => {
                setReplyingTo(null);
                setEditingReply(r);
                setReplyText(r.message);
              }}
              onReply={(r) => {
                setEditingReply(null);
                setReplyText("");
                setReplyingTo(r);
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

      {mentionState && (
        <MentionSuggestions
          mentionState={mentionState}
          value={replyText}
          onChangeText={setReplyText}
          onDismiss={() => setMentionState(null)}
          buildingId={Number.isFinite(mentionBuildingId) ? mentionBuildingId : null}
          direction="above"
        />
      )}

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

      {!editingReply && replyingTo && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 6,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600", flex: 1 }}
            numberOfLines={1}
          >
            Replying to {replyingTo.createdByFullName}
          </Text>
          <Pressable
            onPress={() => {
              setReplyingTo(null);
              setReplyText("");
            }}
          >
            <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "600" }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

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
                : replyingTo
                  ? `Reply to ${replyingTo.createdByFullName}…`
                  : `Reply to ${parentAuthor || "post"}…`
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
        }}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
