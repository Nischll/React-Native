import AppIcon from "@/src/components/ui/AppIcon";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommunicationItem } from "@/src/types/communication.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

const DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = 50;

const OWN = {
  bg: "#EDE9FE",
  border: "#DDD6FE",
  name: "#5B21B6",
  text: "#3B0764",
  meta: "#7C3AED",
} as const;

const OTHER = {
  bg: "#FFFFFF",
  border: "#E2E8F0",
  name: "#1E293B",
  text: "#334155",
  meta: "#94A3B8",
} as const;

interface ReplyRowProps {
  item: CommunicationItem;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
  onRequestDelete: (id: number) => void;
  onEdit: (item: CommunicationItem) => void;
}

export function ReplyRow({
  item,
  openSwipeId,
  onSwipeOpen,
  onRequestDelete,
  onEdit,
}: ReplyRowProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false && !isOwn;
  const C = isOwn ? OWN : OTHER;

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const isSwipedRef = useRef(false);

  const isLong = item.message.length > 180;
  const displayText =
    isLong && !expanded ? item.message.slice(0, 180) + "…" : item.message;

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
    onSwipeOpen(item.id);
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
    if (openSwipeId === item.id) onSwipeOpen(null);
  };

  if (openSwipeId !== item.id && isSwipedRef.current) snapClosed();

  useEffect(() => {
    if (openSwipeId !== item.id && isSwipedRef.current) snapClosed();
  }, [openSwipeId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        if (isSwipedRef.current) {
          snapClosed();
          return true;
        }
        return false;
      },
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isOwn) return false;
        return Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 5;
      },
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
      onPanResponderTerminate: () => snapClosed(),
    }),
  ).current;

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <AuthorAvatar
          fullName={item.createdByFullName}
          size={34}
          fontSize={13}
        />

        {/* Card column */}
        <View style={{ flex: 1 }}>
          <View style={{ borderRadius: 12 }}>
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
                  onPress={() => onRequestDelete(item.id)}
                  style={{ alignItems: "center", gap: 4, padding: 8 }}
                >
                  <AppIcon name="trash-outline" size={20} color="#EF4444" />
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#EF4444",
                      fontWeight: "700",
                    }}
                  >
                    Delete
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            <Animated.View
              style={{
                transform: [{ translateX }],
                zIndex: 6,
                borderRadius: 12,
                overflow: "hidden",
              }}
              {...(isOwn ? panResponder.panHandlers : {})}
            >
              {isNew && (
                <View style={{ height: 3, backgroundColor: "#7C3AED" }} />
              )}

              <View
                style={{
                  backgroundColor: C.bg,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: isNew ? 1.5 : 1,
                  borderColor: C.border,
                }}
              >
                {!isOwn && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: C.name,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.createdByFullName}
                  </Text>
                )}

                {isNew && (
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "#7C3AED",
                      borderRadius: 99,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}
                    >
                      NEW
                    </Text>
                  </View>
                )}

                {/* Message */}
                <MessageText text={displayText} />
                {isLong && (
                  <Pressable
                    onPress={() => setExpanded((v) => !v)}
                    style={{
                      marginTop: 4,
                      alignSelf: isOwn ? "flex-end" : "flex-start",
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, color: C.meta, fontWeight: "600" }}
                    >
                      {expanded ? "Show less" : "Read more"}
                    </Text>
                  </Pressable>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: isOwn ? "flex-end" : "flex-start",
                    gap: 14,
                    marginTop: 10,
                  }}
                >
                  {isOwn && (
                    <Pressable
                      onPress={() => onEdit(item)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <AppIcon name="pencil-outline" size={12} color={C.meta} />
                      <Text style={{ fontSize: 12, color: C.meta }}>Edit</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setShowReactionPicker(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <AppIcon name="happy-outline" size={12} color={C.meta} />
                    <Text style={{ fontSize: 12, color: C.meta }}>React</Text>
                  </Pressable>
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    color: C.meta,
                    marginTop: 6,
                    textAlign: isOwn ? "right" : "left",
                  }}
                >
                  {timeAgo(item.createdDate)}
                  {isOwn ? " · swipe to delete" : ""}
                </Text>
              </View>
            </Animated.View>
          </View>

          {(item.reactions ?? []).length > 0 && (
            <View
              style={{
                marginTop: 4,
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
        </View>
      </View>

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
              communicationId={item.id}
              onClose={() => setShowReactionPicker(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
