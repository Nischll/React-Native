import {
  CommunicationItem,
  useDeleteCommunicationWithRefresh,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { timeAgo } from "@/src/utils/timeAgo";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";
import { ReplyComposer } from "./ReplyComposer";

interface ReplyItemProps {
  item: CommunicationItem;
  depth?: number;
}

export function ReplyItem({ item, depth = 0 }: ReplyItemProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;

  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.message);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutate: updateMsg, isPending: updating } =
    useUpdateCommunicationWithRefresh();
  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === item.message) {
      setEditing(false);
      return;
    }
    updateMsg(
      { id: item.id, message: trimmed, parentId: item.parentId },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    deleteMsg(item.id, { onSuccess: () => setShowDeleteModal(false) });
  };

  const leftInset = depth === 0 ? 12 : 0;

  return (
    <View style={{ marginLeft: leftInset }}>
      {depth > 0 && (
        <View
          style={{
            position: "absolute",
            left: -12,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#E2E8F0",
            borderRadius: 2,
          }}
        />
      )}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <AuthorAvatar
          fullName={item.createdByFullName}
          size={28}
          fontSize={10}
        />

        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}>
              {item.createdByFullName}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>·</Text>
            <Text style={{ fontSize: 11, color: "#94A3B8" }}>
              {timeAgo(item.createdDate)}
            </Text>
            {isOwn && (
              <View
                style={{ flexDirection: "row", gap: 10, marginLeft: "auto" }}
              >
                <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                  <AppIcon name="pencil-outline" size={13} color="#94A3B8" />
                </Pressable>
                <Pressable onPress={() => setShowDeleteModal(true)} hitSlop={8}>
                  <AppIcon name="trash-outline" size={13} color="#F87171" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Message / edit */}
          {editing ? (
            <View
              style={{
                borderWidth: 1.5,
                borderColor: "#7C3AED",
                borderRadius: 10,
                padding: 8,
                backgroundColor: "#FAFAF9",
              }}
            >
              <TextInput
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
                style={{ fontSize: 13, color: "#1E293B", minHeight: 36 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 6,
                  justifyContent: "flex-end",
                }}
              >
                <Pressable
                  onPress={() => {
                    setEditing(false);
                    setEditText(item.message);
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
                <Pressable onPress={handleSaveEdit} disabled={updating}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#7C3AED",
                      fontWeight: "700",
                    }}
                  >
                    {updating ? "Saving…" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 13, color: "#334155", lineHeight: 19 }}>
              {item.message}
            </Text>
          )}

          {/* Reactions */}
          <ReactionBar
            communicationId={item.id}
            reactions={item.reactions}
            onOpenPicker={() => setShowReactionPicker(true)}
          />

          {/* Reply toggle */}
          <Pressable
            onPress={() => setShowReplyComposer((v) => !v)}
            style={{ marginTop: 6, alignSelf: "flex-start" }}
          >
            <Text style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}>
              {showReplyComposer ? "Cancel" : "Reply"}
            </Text>
          </Pressable>

          {showReplyComposer && (
            <ReplyComposer
              parentId={item.id}
              parentAuthor={item.createdByFullName}
              onDone={() => setShowReplyComposer(false)}
            />
          )}

          {/* Nested replies */}
          {item.replies.length > 0 && (
            <View style={{ marginTop: 10, gap: 10 }}>
              <Pressable
                onPress={() => setShowReplies((v) => !v)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <AppIcon
                  name={showReplies ? "chevron-up" : "chevron-down"}
                  size={12}
                  color="#7C3AED"
                />
                <Text
                  style={{ fontSize: 12, color: "#7C3AED", fontWeight: "600" }}
                >
                  {showReplies
                    ? "Hide"
                    : `View ${item.replies.length} repl${item.replies.length > 1 ? "ies" : "y"}`}
                </Text>
              </Pressable>
              {showReplies &&
                item.replies.map((reply) => (
                  <ReplyItem key={reply.id} item={reply} depth={depth + 1} />
                ))}
            </View>
          )}
        </View>
      </View>

      <ReactionPicker
        visible={showReactionPicker}
        communicationId={item.id}
        onClose={() => setShowReactionPicker(false)}
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Reply"
        message="Are you sure you want to delete this reply?"
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}
