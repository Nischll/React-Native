import {
  buildReplyTree,
  getReplyCount,
  useDeleteCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommunicationItem } from "@/src/types/communication.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import InlineReplyComposer from "./InlineReplyComposer";
import { ReactionBar, ReactionPicker } from "./ReactionBar";
import { ReplyRow } from "./ReplyRow";

interface NoticeCardProps {
  item: CommunicationItem;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
  onEdit: (item: CommunicationItem) => void;
  currentUserEmail?: string | null;
  mentionBuildingId?: number | null;
  replyingToId: number | null;
  replyMessage: string;
  sendingReply?: boolean;
  onReplyStart: (item: CommunicationItem) => void;
  onReplyCancel: () => void;
  onReplyMessageChange: (value: string) => void;
  onReplySubmit: (parentId: number) => void;
}

const DELETE_REVEAL_WIDTH = 80;
const SWIPE_THRESHOLD = 50;
const CARD_PADDING = 6;

export function NoticeCard({
  item,
  openSwipeId,
  onSwipeOpen,
  onEdit,
  currentUserEmail,
  mentionBuildingId,
  replyingToId,
  replyMessage,
  sendingReply = false,
  onReplyStart,
  onReplyCancel,
  onReplyMessageChange,
  onReplySubmit,
}: NoticeCardProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false && !isOwn;
  const isReplying = replyingToId === item.id;

  const hasUnseenReplies = (item.replyUnseenCount ?? 0) > 0;
  const unseenReplyCount = item.replyUnseenCount ?? 0;
  const replyCount = getReplyCount(item);
  const replies = useMemo(
    () => buildReplyTree(item.id, Array.isArray(item.replies) ? item.replies : []),
    [item],
  );

  const isAllBuildings = (item.buildingIds ?? []).length === 0;

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleteZoneVisible, setDeleteZoneVisible] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.8)).current;
  const isSwipedRef = useRef(false);

  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();

  const isLong = item.message.length > 180;
  const displayText =
    isLong && !expanded ? item.message.slice(0, 180) + "…" : item.message;

  const snapOpen = () => {
    isSwipedRef.current = true;
    setDeleteZoneVisible(true);
    Animated.spring(translateX, {
      toValue: -DELETE_REVEAL_WIDTH,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    deleteScale.setValue(1);
    onSwipeOpen(item.id);
  };

  const snapClosed = () => {
    isSwipedRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start(() => setDeleteZoneVisible(false));
    deleteScale.setValue(0.8);
    if (openSwipeId === item.id) onSwipeOpen(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => isSwipedRef.current,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isOwn) return false;
        return Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 5;
      },
      onPanResponderMove: (_, g) => {
        if (!isOwn) return;
        const clamped = Math.max(
          -(DELETE_REVEAL_WIDTH + 10),
          Math.min(0, g.dx),
        );
        translateX.setValue(clamped);
        const progress = Math.min(1, Math.abs(clamped) / DELETE_REVEAL_WIDTH);
        deleteScale.setValue(0.8 + progress * 0.2);
        if (progress > 0.05) setDeleteZoneVisible(true);
      },
      onPanResponderRelease: (_, g) => {
        if (!isOwn) return;
        g.dx < -SWIPE_THRESHOLD ? snapOpen() : snapClosed();
      },
      onPanResponderTerminate: () => snapClosed(),
    }),
  ).current;

  const handleDelete = () => {
    isSwipedRef.current = false;
    onSwipeOpen(null);
    Animated.timing(translateX, {
      toValue: -500,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setDeleteZoneVisible(false);
      deleteMsg(item.id);
    });
  };

  return (
    <View
      style={{ paddingHorizontal: CARD_PADDING, paddingVertical: CARD_PADDING }}
    >
      {isOwn && deleteZoneVisible && (
        <View
          style={{
            position: "absolute",
            right: CARD_PADDING,
            top: CARD_PADDING,
            bottom: CARD_PADDING,
            width: DELETE_REVEAL_WIDTH,
            backgroundColor: "#FEE2E2",
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {deleting ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <ActivityIndicator size="small" color="#EF4444" />
              <Text
                style={{ fontSize: 10, color: "#EF4444", fontWeight: "600" }}
              >
                Deleting…
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={handleDelete}
              style={{ alignItems: "center", gap: 4, padding: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
                <AppIcon name="trash-outline" size={22} color="#EF4444" />
              </Animated.View>
              <Text
                style={{ fontSize: 10, color: "#EF4444", fontWeight: "700" }}
              >
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Animated.View
        style={{
          transform: [{ translateX }],
          zIndex: 6,
          borderRadius: 16,
          overflow: "visible",
        }}
        className="shadow-md"
        {...(isOwn ? panResponder.panHandlers : {})}
      >
        <Card
          style={{
            borderWidth: isNew ? 1.5 : 1,
            borderColor: isNew ? "#7C3AED" : "#E2E8F0",
            backgroundColor: "#fff",
            borderRadius: 16,
            shadowColor: "#64748B",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {isNew && <View style={{ height: 3, backgroundColor: "#7C3AED" }} />}

          <View style={{ padding: 14 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AuthorAvatar
                fullName={item.createdByFullName}
                size={38}
                fontSize={13}
              />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1E293B",
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.createdByFullName}
                  </Text>
                  {!isOwn ? (
                    <View
                      style={{
                        borderRadius: 99,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        backgroundColor: item.seen ? "#D1FAE5" : "#FEF3C7",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: item.seen ? "#047857" : "#B45309",
                        }}
                      >
                        {item.seen ? "Seen" : "Unseen"}
                      </Text>
                    </View>
                  ) : null}
                  {hasUnseenReplies ? (
                    <View
                      style={{
                        borderRadius: 99,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        backgroundColor: "#FEF3C7",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#B45309",
                        }}
                      >
                        {unseenReplyCount} unseen{" "}
                        {unseenReplyCount === 1 ? "reply" : "replies"}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 1,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#94A3B8" }}>
                    {timeAgo(item.createdDate)}
                  </Text>
                  {isAllBuildings && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                        backgroundColor: "#F0FDF4",
                        borderRadius: 99,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <AppIcon name="globe-outline" size={10} color="#16A34A" />
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#16A34A",
                          fontWeight: "600",
                        }}
                      >
                        All Buildings
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {isOwn && (
                <Pressable
                  onPress={() => onEdit(item)}
                  hitSlop={8}
                  style={{ paddingTop: 2 }}
                >
                  <AppIcon name="pencil-outline" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <MessageText
                text={displayText}
                currentUserEmail={currentUserEmail}
              />
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

              {!isAllBuildings && (item.buildingIds ?? []).length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {(item.buildingIds ?? []).map((id) => {
                    const building = user?.buildingList.find(
                      (b) => b.value === String(id),
                    );
                    if (!building) return null;
                    return (
                      <View
                        key={id}
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#F0FDF4",
                          borderRadius: 99,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <AppIcon
                          name="business-outline"
                          size={11}
                          color="#16A34A"
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#16A34A",
                            fontWeight: "600",
                          }}
                        >
                          {building.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <ReactionBar
              communicationId={item.id}
              reactions={item.reactions}
              onOpenPicker={() => setShowReactionPicker(true)}
            />

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
                onPress={() => onReplyStart(item)}
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <AppIcon
                  name="chatbubble-outline"
                  size={15}
                  color={hasUnseenReplies ? "#7C3AED" : "#64748B"}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: hasUnseenReplies ? "#7C3AED" : "#64748B",
                  }}
                >
                  {replyCount > 0
                    ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                    : "Reply"}
                </Text>
              </Pressable>

              {isOwn && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginLeft: "auto",
                  }}
                >
                  <AppIcon
                    name="arrow-back-outline"
                    size={11}
                    color="#CBD5E1"
                  />
                  <Text style={{ fontSize: 11, color: "#CBD5E1" }}>
                    Swipe to delete
                  </Text>
                </View>
              )}
            </View>

            {isReplying ? (
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
        </Card>
      </Animated.View>

      {replies.length > 0 ? (
        <View
          style={{
            marginTop: 4,
            marginLeft: 12,
            paddingLeft: 10,
            borderLeftWidth: 2,
            borderLeftColor: "#DDD6FE",
          }}
        >
          {replies.map((child) => (
            <ReplyRow
              key={child.id}
              item={child}
              openSwipeId={openSwipeId}
              onSwipeOpen={onSwipeOpen}
              onRequestDelete={(id) => deleteMsg(id)}
              onEdit={onEdit}
              onReply={onReplyStart}
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
