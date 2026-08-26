import AppIcon from "@/src/components/ui/AppIcon";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommunicationItem } from "@/src/types/communication.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import InlineReplyComposer from "./InlineReplyComposer";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

interface ReplyRowProps {
  item: CommunicationItem;
  depth?: number;
  onRequestDelete: (id: number) => void;
  onEdit: (item: CommunicationItem) => void;
  onReply: (item: CommunicationItem) => void;
  currentUserEmail?: string | null;
  mentionBuildingId?: number | null;
  replyingToId?: number | null;
  replyMessage?: string;
  sendingReply?: boolean;
  onReplyMessageChange?: (value: string) => void;
  onReplySubmit?: (parentId: number) => void;
  onReplyCancel?: () => void;
}

export function ReplyRow({
  item,
  depth = 0,
  onRequestDelete,
  onEdit,
  onReply,
  currentUserEmail,
  mentionBuildingId,
  replyingToId = null,
  replyMessage = "",
  sendingReply = false,
  onReplyMessageChange,
  onReplySubmit,
  onReplyCancel,
}: ReplyRowProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false && !isOwn;
  const isReplying = replyingToId === item.id;

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isLong = item.message.length > 180;
  const displayText =
    isLong && !expanded ? item.message.slice(0, 180) + "…" : item.message;

  const bubbleBg = isOwn ? "#453956" : "#FFFFFF";
  const bubbleBorder = isOwn ? "#453956" : isNew ? "#F59E0B" : "#E2E8F0";
  const nameColor = isOwn ? "rgba(255,255,255,0.8)" : "#0F172A";
  const metaColor = isOwn ? "rgba(255,255,255,0.7)" : "#64748B";
  const actionColor = isOwn ? "rgba(255,255,255,0.85)" : "#64748B";

  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={{
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <AuthorAvatar
          fullName={item.createdByFullName}
          size={28}
          fontSize={11}
        />

        <View style={{ maxWidth: "82%", minWidth: 132, flexShrink: 1 }}>
          <View
            style={{
              backgroundColor: bubbleBg,
              borderRadius: 16,
              borderTopLeftRadius: isOwn ? 16 : 4,
              borderTopRightRadius: isOwn ? 4 : 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: bubbleBorder,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: nameColor }}
                numberOfLines={1}
              >
                {isOwn ? "You" : item.createdByFullName}
              </Text>
              {isOwn ? (
                <View
                  style={{
                    borderRadius: 99,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    backgroundColor: "rgba(255,255,255,0.18)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: "#fff",
                      letterSpacing: 0.3,
                    }}
                  >
                    SENT
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    borderRadius: 99,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    backgroundColor: isNew ? "#FEF3C7" : "#F1F5F9",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: isNew ? "#B45309" : "#64748B",
                      letterSpacing: 0.3,
                    }}
                  >
                    {isNew ? "NEW" : "RECEIVED"}
                  </Text>
                </View>
              )}
            </View>

            <MessageText
              text={displayText}
              currentUserEmail={currentUserEmail}
              textStyle={{
                fontSize: 14,
                lineHeight: 20,
                color: isOwn ? "#FFFFFF" : "#334155",
              }}
            />
            {isLong && (
              <Pressable
                onPress={() => setExpanded((v) => !v)}
                style={{ marginTop: 4 }}
              >
                <Text
                  style={{ fontSize: 12, color: metaColor, fontWeight: "600" }}
                >
                  {expanded ? "Show less" : "Read more"}
                </Text>
              </Pressable>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: isOwn
                  ? "rgba(255,255,255,0.15)"
                  : "#F1F5F9",
              }}
            >
              {isOwn && (
                <>
                  <Pressable
                    onPress={() => onEdit(item)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    <AppIcon name="pencil-outline" size={12} color={actionColor} />
                    <Text style={{ fontSize: 11, color: actionColor }}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onRequestDelete(item.id)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                  >
                    <AppIcon name="trash-outline" size={12} color="#FCA5A5" />
                    <Text style={{ fontSize: 11, color: "#FCA5A5" }}>
                      Delete
                    </Text>
                  </Pressable>
                </>
              )}
              <Pressable
                onPress={() => onReply(item)}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <AppIcon
                  name="return-down-forward"
                  size={12}
                  color={actionColor}
                />
                <Text style={{ fontSize: 11, color: actionColor }}>Reply</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowReactionPicker(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <AppIcon name="happy-outline" size={12} color={actionColor} />
                <Text style={{ fontSize: 11, color: actionColor }}>React</Text>
              </Pressable>
            </View>
          </View>

          <Text
            style={{
              fontSize: 10,
              color: "#94A3B8",
              marginTop: 4,
              marginHorizontal: 4,
              textAlign: isOwn ? "right" : "left",
            }}
          >
            {timeAgo(item.createdDate)}
          </Text>

          {(item.reactions ?? []).length > 0 && (
            <View
              style={{
                marginTop: 2,
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}
            >
              <ReactionBar
                communicationId={item.id}
                reactions={item.reactions}
                onOpenPicker={() => setShowReactionPicker(true)}
              />
            </View>
          )}

          {isReplying &&
          onReplySubmit &&
          onReplyCancel &&
          onReplyMessageChange ? (
            <InlineReplyComposer
              value={replyMessage}
              onChange={onReplyMessageChange}
              onSubmit={() => onReplySubmit(item.id)}
              onCancel={onReplyCancel}
              sending={sendingReply}
              mentionBuildingId={mentionBuildingId}
            />
          ) : null}
        </View>
      </View>

      {(item.replies ?? []).length > 0 ? (
        <View
          style={{
            marginTop: 8,
            marginLeft: isOwn ? 8 : 20,
            marginRight: isOwn ? 20 : 8,
            paddingLeft: 10,
            borderLeftWidth: 2,
            borderLeftColor: "#C4B5FD",
          }}
        >
          {(item.replies ?? []).map((child) => (
            <ReplyRow
              key={child.id}
              item={child}
              depth={depth + 1}
              onRequestDelete={onRequestDelete}
              onEdit={onEdit}
              onReply={onReply}
              currentUserEmail={currentUserEmail}
              mentionBuildingId={mentionBuildingId}
              replyingToId={replyingToId}
              replyMessage={replyMessage}
              sendingReply={sendingReply}
              onReplyMessageChange={onReplyMessageChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
            />
          ))}
        </View>
      ) : null}

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
    </View>
  );
}
