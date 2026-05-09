import {
  CommunicationItem,
  useDeleteCommunicationWithRefresh,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { timeAgo } from "@/src/utils/timeAgo";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";
import { ReplyComposer } from "./ReplyComposer";
import { ReplyItem } from "./ReplyItem";

interface NoticeCardProps {
  item: CommunicationItem;
}

// Highlights @mentions in purple
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(@[^@]+(?=@|$))/g);
  return (
    <Text style={{ fontSize: 14, color: "#334155", lineHeight: 22 }}>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <Text key={i} style={{ color: "#7C3AED", fontWeight: "700" }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

export function NoticeCard({ item }: NoticeCardProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false;

  const [showReplies, setShowReplies] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.message);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { mutate: updateMsg, isPending: updating } =
    useUpdateCommunicationWithRefresh();
  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();

  const isLong = item.message.length > 180;
  const displayText =
    isLong && !expanded ? item.message.slice(0, 180) + "…" : item.message;

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === item.message) {
      setEditing(false);
      return;
    }
    updateMsg(
      { id: item.id, message: trimmed, parentId: null },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    deleteMsg(item.id, { onSuccess: () => setShowDeleteModal(false) });
  };

  return (
    <Card
      style={{
        overflow: "hidden",
        borderWidth: isNew ? 1.5 : 1,
        borderColor: isNew ? "#7C3AED" : "#E2E8F0",
        backgroundColor: "#fff",
      }}
      className="mb-6"
    >
      {/* Unseen strip */}
      {isNew && <View style={{ height: 3, backgroundColor: "#7C3AED" }} />}

      <View style={{ padding: 14 }}>
        {/* Header */}
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
          <AuthorAvatar
            fullName={item.createdByFullName}
            size={38}
            fontSize={13}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1E293B",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.createdByFullName}
              </Text>
              {isNew && (
                <View
                  style={{
                    backgroundColor: "#7C3AED",
                    borderRadius: 99,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    marginLeft: 6,
                  }}
                >
                  <Text
                    style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}
                  >
                    NEW
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
              {timeAgo(item.createdDate)}
            </Text>
          </View>

          {isOwn && (
            <View style={{ flexDirection: "row", gap: 12, paddingTop: 2 }}>
              <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                <AppIcon name="pencil-outline" size={16} color="#94A3B8" />
              </Pressable>
              <Pressable onPress={() => setShowDeleteModal(true)} hitSlop={8}>
                <AppIcon name="trash-outline" size={16} color="#F87171" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Message */}
        <View style={{ marginTop: 12 }}>
          {editing ? (
            <View
              style={{
                borderWidth: 1.5,
                borderColor: "#7C3AED",
                borderRadius: 12,
                padding: 10,
                backgroundColor: "#FAFAF9",
              }}
            >
              <TextInput
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
                style={{ fontSize: 14, color: "#1E293B", minHeight: 60 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 8,
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
                      fontSize: 13,
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
                      fontSize: 13,
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
            <>
              <MessageText text={displayText} />
              {isLong && (
                <Pressable
                  onPress={() => setExpanded((v) => !v)}
                  style={{ marginTop: 4 }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#7C3AED",
                      fontWeight: "600",
                    }}
                  >
                    {expanded ? "Show less" : "Read more"}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Reactions */}
        <ReactionBar
          communicationId={item.id}
          reactions={item.reactions}
          onOpenPicker={() => setShowReactionPicker(true)}
        />

        {/* Footer actions */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            gap: 16,
          }}
        >
          <Pressable
            onPress={() => setShowReplyComposer((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <AppIcon
              name="chatbubble-outline"
              size={15}
              color={showReplyComposer ? "#7C3AED" : "#64748B"}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: showReplyComposer ? "#7C3AED" : "#64748B",
              }}
            >
              Reply
            </Text>
          </Pressable>

          {item.replies.length > 0 && (
            <Pressable
              onPress={() => setShowReplies((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <AppIcon
                name={
                  showReplies ? "chevron-up-outline" : "chevron-down-outline"
                }
                size={15}
                color="#64748B"
              />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}
              >
                {item.replies.length}{" "}
                {item.replies.length === 1 ? "reply" : "replies"}
              </Text>
            </Pressable>
          )}
        </View>

        {showReplyComposer && (
          <ReplyComposer
            parentId={item.id}
            parentAuthor={item.createdByFullName}
            onDone={() => setShowReplyComposer(false)}
          />
        )}

        {showReplies && item.replies.length > 0 && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "#F1F5F9",
              gap: 12,
              paddingLeft: 4,
            }}
          >
            {item.replies.map((reply) => (
              <ReplyItem key={reply.id} item={reply} depth={0} />
            ))}
          </View>
        )}
      </View>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            padding: 32,
          }}
          onPress={() => setShowReactionPicker(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ReactionPicker
              communicationId={item.id}
              onClose={() => setShowReactionPicker(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Notice"
        message="This will permanently delete this notice and all its replies."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </Card>
  );
}
