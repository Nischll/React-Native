import {
  getReplyCount,
  useDeleteCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommunicationItem } from "@/src/types/communication.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

interface NoticeCardProps {
  item: CommunicationItem;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
  onEdit: (item: CommunicationItem) => void;
  currentUserEmail?: string | null;
  mentionBuildingId?: number | null;
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
}: NoticeCardProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false && !isOwn;

  const hasUnseenReplies = (item.replyUnseenCount ?? 0) > 0;
  const unseenReplyCount = item.replyUnseenCount ?? 0;
  const replyCount = getReplyCount(item);

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
        return Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 12;
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

  const accentColor = isOwn ? "#453956" : isNew ? "#F59E0B" : "#CBD5E1";
  const cardBg = isOwn ? "#F8F5FF" : "#FFFFFF";

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
            width: DELETE_REVEAL_WIDTH,
            height: 88,
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
      >
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isOwn ? "#DDD6FE" : isNew ? "#F59E0B" : "#E2E8F0",
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          <View style={{ width: 4, backgroundColor: accentColor }} />
          <View style={{ flex: 1, padding: 14 }}>
            <View {...(isOwn ? panResponder.panHandlers : {})}>
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
                    {isOwn ? "You" : item.createdByFullName}
                  </Text>
                  <View
                    style={{
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      backgroundColor: isOwn
                        ? "#EDE9FE"
                        : item.seen
                          ? "#D1FAE5"
                          : "#FEF3C7",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isOwn
                          ? "#5B21B6"
                          : item.seen
                            ? "#047857"
                            : "#B45309",
                      }}
                    >
                      {isOwn ? "Sent" : item.seen ? "Received" : "New"}
                    </Text>
                  </View>
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingTop: 2,
                  }}
                >
                  <Pressable onPress={() => onEdit(item)} hitSlop={8}>
                    <AppIcon name="pencil-outline" size={16} color="#64748B" />
                  </Pressable>
                  <Pressable onPress={handleDelete} hitSlop={8}>
                    <AppIcon name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
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
            </View>

            <ReactionBar
              communicationId={item.id}
              reactions={item.reactions ?? []}
              onOpenPicker={() => setShowReactionPicker(true)}
            />
            <ReactionPicker
              visible={showReactionPicker}
              communicationId={item.id}
              onClose={() => setShowReactionPicker(false)}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: "#EDE9FE",
                gap: 16,
              }}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(private)/(tabs)/(updates)/replies",
                    params: {
                      parentId: String(item.id),
                      author: item.createdByFullName ?? "",
                      message: (item.message ?? "").slice(0, 400),
                      mentionBuildingId:
                        mentionBuildingId != null
                          ? String(mentionBuildingId)
                          : "",
                    },
                  })
                }
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
                {hasUnseenReplies ? (
                  <View
                    style={{
                      backgroundColor: "#7C3AED",
                      borderRadius: 99,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 18,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      {unseenReplyCount}
                    </Text>
                  </View>
                ) : null}
                <AppIcon name="chevron-forward" size={14} color="#94A3B8" />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
