import { CommunicationItem } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useAuth } from "@/src/providers/AuthProvider";
import { timeAgo } from "@/src/utils/timeAgo";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

const REPLY_DELETE_WIDTH = 80;
const REPLY_SWIPE_THRESHOLD = 50;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const BASE_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

// ─── Reply Row ────────────────────────────────────────────────────────────────

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
  const isNew = item.seen === false;

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
        toValue: -REPLY_DELETE_WIDTH,
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

  useEffect(() => {
    if (openSwipeId !== item.id && isSwipedRef.current) {
      snapClosed();
    }
  }, [openSwipeId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isOwn) return false;
        const isHorizontal = Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
        const hasMoved = Math.abs(g.dx) > 5;
        return isHorizontal && hasMoved;
      },
      onStartShouldSetPanResponderCapture: () => isSwipedRef.current,
      onPanResponderMove: (_, g) => {
        if (!isOwn) return;
        const dx = Math.min(0, g.dx);
        const clamped = Math.max(-(REPLY_DELETE_WIDTH + 10), dx);
        translateX.setValue(clamped);
        const progress = Math.min(1, Math.abs(clamped) / REPLY_DELETE_WIDTH);
        deleteOpacity.setValue(progress);
      },
      onPanResponderRelease: (_, g) => {
        if (!isOwn) return;
        if (g.dx < -REPLY_SWIPE_THRESHOLD) {
          snapOpen();
        } else {
          snapClosed();
        }
      },
      onPanResponderTerminate: () => {
        snapClosed();
      },
    }),
  ).current;

  return (
    <View style={{ borderRadius: 12, marginBottom: 4 }}>
      {isOwn && (
        <Animated.View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: REPLY_DELETE_WIDTH,
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
            <Text style={{ fontSize: 10, color: "#EF4444", fontWeight: "700" }}>
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
        {isNew && <View style={{ height: 3, backgroundColor: "#7C3AED" }} />}
        <View
          style={{
            backgroundColor: "#F8FAFC",
            borderRadius: 12,
            padding: 12,
            borderWidth: isNew ? 1.5 : 1,
            borderColor: "#E2E8F0",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AuthorAvatar
              fullName={item.createdByFullName}
              size={30}
              fontSize={11}
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
                  style={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}
                  numberOfLines={1}
                >
                  {item.createdByFullName}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                    {timeAgo(item.createdDate)}
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
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        NEW
                      </Text>
                    </View>
                  )}
                  {isOwn && (
                    <Pressable onPress={() => onEdit(item)} hitSlop={8}>
                      <AppIcon
                        name="pencil-outline"
                        size={13}
                        color="#94A3B8"
                      />
                    </Pressable>
                  )}
                  {isOwn && (
                    <AppIcon
                      name="arrow-back-outline"
                      size={11}
                      color="#CBD5E1"
                    />
                  )}
                </View>
              </View>

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
            </View>
          </View>

          <View style={{ marginLeft: 38 }}>
            <ReactionBar
              communicationId={item.id}
              reactions={item.reactions}
              onOpenPicker={() => setShowReactionPicker(true)}
            />
          </View>
        </View>
      </Animated.View>

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
