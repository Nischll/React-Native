import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  CommentResponse,
  TaskResponseData,
} from "@/src/types/task-management.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { Avatar, ReactionBar, ReactionPicker } from "./TaskCommentReaction";

const DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = 50;

interface Props {
  comment: CommentResponse;
  taskId: number;
  depth?: number;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
  onRequestDelete: (id: number) => void;
  onEdit: (comment: CommentResponse) => void;
  onReply: (comment: CommentResponse) => void;
  task: TaskResponseData;
}

export function CommentRow({
  comment,
  taskId,
  depth = 0,
  openSwipeId,
  onSwipeOpen,
  onRequestDelete,
  onEdit,
  onReply,
  task,
}: Props) {
  const { user } = useAuth();
  const isOwn = user?.userId === comment.messageFrom;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const isSwipedRef = useRef(false);

  const isLong = comment.message.length > 180;
  const displayText =
    isLong && !expanded ? comment.message.slice(0, 180) + "…" : comment.message;

  const hasReplies = comment.replies && comment.replies.length > 0;

  const snapOpen = () => {
    isSwipedRef.current = true;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: -DELETE_WIDTH,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    onSwipeOpen(comment.id);
  };

  const snapClosed = () => {
    isSwipedRef.current = false;
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    if (openSwipeId === comment.id) onSwipeOpen(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isOwn) return false;
        return Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 5;
      },
      onStartShouldSetPanResponderCapture: () => isSwipedRef.current,
      onPanResponderMove: (_, g) => {
        if (!isOwn) return;
        const clamped = Math.max(-(DELETE_WIDTH + 10), Math.min(0, g.dx));
        translateX.setValue(clamped);
        deleteOpacity.setValue(Math.min(1, Math.abs(clamped) / DELETE_WIDTH));
      },
      onPanResponderRelease: (_, g) => {
        if (!isOwn) return;
        g.dx < -SWIPE_THRESHOLD ? snapOpen() : snapClosed();
      },
      onPanResponderTerminate: snapClosed,
    }),
  ).current;

  // close swipe when another opens
  if (openSwipeId !== comment.id && isSwipedRef.current) snapClosed();

  const authorName = (() => {
    if (comment.messageFrom === task.createdBy) {
      return [
        task.creatorFirstName,
        task.creatorMiddleName,
        task.creatorLastName,
      ]
        .filter(Boolean)
        .join(" ");
    }
    if (comment.messageFrom === task.assignedTo) {
      return [
        task.assignedFirstName,
        task.assignedMiddleName,
        task.assignedLastName,
      ]
        .filter(Boolean)
        .join(" ");
    }
    return comment.authorName ?? "Unknown";
  })();

  // Cap indent
  const indentLeft = Math.min(depth, 2) * 16;
  return (
    <View style={{ marginLeft: indentLeft, marginBottom: 8 }}>
      {/* Thread line for nested */}
      {depth > 0 && (
        <View
          style={{
            position: "absolute",
            left: -12,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#E2E8F0",
            borderRadius: 1,
          }}
        />
      )}

      <View style={{ borderRadius: 12, overflow: "visible" }}>
        {/* Delete background */}
        {isOwn && (
          <Animated.View
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: DELETE_WIDTH,
              backgroundColor: "#FEE2E2",
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: deleteOpacity,
            }}
          >
            <Pressable
              onPress={() => onRequestDelete(comment.id)}
              style={{ alignItems: "center", gap: 4, padding: 8 }}
            >
              <AppIcon name="trash-outline" size={20} color="#EF4444" />
              <Text
                style={{ fontSize: 10, color: "#EF4444", fontWeight: "700" }}
              >
                Delete
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Comment card */}
        <Animated.View
          style={{ transform: [{ translateX }], zIndex: 6, borderRadius: 12 }}
          {...(isOwn ? panResponder.panHandlers : {})}
        >
          <View
            style={{
              backgroundColor: depth === 0 ? "#F8FAFC" : "#FFFFFF",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            {/* Header row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Avatar
                name={comment.authorName ?? "U"}
                size={depth === 0 ? 34 : 28}
              />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#1E293B",
                    }}
                    numberOfLines={1}
                  >
                    {comment.authorName}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                      {timeAgo(comment.createdDate ?? "")}
                    </Text>
                    {isOwn && (
                      <Pressable onPress={() => onEdit(comment)} hitSlop={8}>
                        <AppIcon
                          name="pencil-outline"
                          size={13}
                          color="#94A3B8"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Message */}
                <Text
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    lineHeight: 20,
                    marginTop: 4,
                  }}
                >
                  {displayText}
                </Text>
                {isLong && (
                  <Pressable
                    onPress={() => setExpanded((v) => !v)}
                    style={{ marginTop: 2 }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#7C3AED",
                        fontWeight: "600",
                      }}
                    >
                      {expanded ? "Show less" : "Read more"}
                    </Text>
                  </Pressable>
                )}

                {/* Action row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  {depth < 2 && (
                    <Pressable
                      onPress={() => onReply(comment)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AppIcon
                        name="chatbubble-outline"
                        size={13}
                        color="#94A3B8"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          fontWeight: "600",
                        }}
                      >
                        Reply
                      </Text>
                    </Pressable>
                  )}
                  {hasReplies && (
                    <Pressable
                      onPress={() => setRepliesExpanded((v) => !v)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AppIcon
                        name={
                          repliesExpanded
                            ? "chevron-up-outline"
                            : "chevron-down-outline"
                        }
                        size={13}
                        color="#7C3AED"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#7C3AED",
                          fontWeight: "600",
                        }}
                      >
                        {repliesExpanded
                          ? "Hide"
                          : `View ${comment.replies?.length} ${comment.replies?.length === 1 ? "reply" : "replies"}`}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Reactions */}
                <ReactionBar
                  commentId={comment.id}
                  reactions={comment.reactions ?? []}
                  onOpenPicker={() => setShowReactionPicker(true)}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Inline replies */}
      {repliesExpanded && hasReplies && (
        <View style={{ marginTop: 6, marginLeft: 16 }}>
          {comment.replies?.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              task={task}
              taskId={taskId}
              depth={depth + 1}
              openSwipeId={openSwipeId}
              onSwipeOpen={onSwipeOpen}
              onRequestDelete={onRequestDelete}
              onEdit={onEdit}
              onReply={onReply}
            />
          ))}
        </View>
      )}

      {/* Reaction picker modal */}
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
              commentId={comment.id}
              onClose={() => setShowReactionPicker(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
