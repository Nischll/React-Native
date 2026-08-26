import { useToggleReactionWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { Reaction } from "@/src/types/communication.types";
import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const EMOJI_OPTIONS = ["👍", "😀", "😍", "🤓", "❤️", "🔥", "👏", "😮"];

interface ReactionBarProps {
  communicationId: number;
  reactions: Reaction[];
  onOpenPicker: () => void;
}

interface TooltipState {
  visible: boolean;
  emoji: string;
  users: { fullName: string }[];
  // We position the tooltip in a Modal so coords don't matter much,
  // but we keep them for future portal-based positioning
  x: number;
  y: number;
}

export function ReactionBar({
  communicationId,
  reactions,
  onOpenPicker,
}: ReactionBarProps) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleReactionWithRefresh();
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    emoji: "",
    users: [],
    x: 0,
    y: 0,
  });
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  const groups = reactions ?? [];
  const myReactions = new Set(
    groups.flatMap((r) =>
      (r.users ?? [])
        .filter((u) => u.userId === user?.userId)
        .map(() => r.reactionType),
    ),
  );

  const showTooltip = (
    emoji: string,
    users: { fullName: string }[],
    x: number,
    y: number,
  ) => {
    setTooltip({ visible: true, emoji, users, x, y });
    Animated.spring(tooltipAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const hideTooltip = () => {
    Animated.timing(tooltipAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setTooltip((s) => ({ ...s, visible: false })));
  };

  const handleReact = (emoji: string) => {
    toggleReaction({
      communicationId,
      reactionType: emoji,
      userId: user?.userId,
    });
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        }}
      >
        {groups.map((r) => {
          const isMine = myReactions.has(r.reactionType);
          return (
            <Pressable
              key={r.reactionType}
              onPress={() => handleReact(r.reactionType)}
              onLongPress={(e) => {
                const { pageX, pageY } = e.nativeEvent;
                showTooltip(r.reactionType, r.users, pageX, pageY);
              }}
              delayLongPress={350}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: isMine ? "#EFE9FF" : "#F8FAFC",
                borderWidth: 1,
                borderColor: isMine ? "#7C3AED" : "#E2E8F0",
                transform: [{ scale: pressed ? 0.93 : 1 }],
                gap: 4,
              })}
            >
              <Text style={{ fontSize: 15 }}>{r.reactionType}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: isMine ? "#7C3AED" : "#64748B",
                }}
              >
                {r.count}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onOpenPicker}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 99,
            borderWidth: 1.5,
            borderColor: "#E2E8F0",
            borderStyle: "dashed",
            backgroundColor: "#F8FAFC",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 13, color: "#94A3B8" }}>＋</Text>
          <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "600" }}>
            React
          </Text>
        </Pressable>
      </View>

      {/* Reaction users tooltip */}
      {tooltip.visible && (
        <Modal
          visible={tooltip.visible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={hideTooltip}
        >
          <TouchableWithoutFeedback onPress={hideTooltip}>
            <View style={{ flex: 1 }}>
              {/* Centered tooltip card */}
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: "30%",
                  alignSelf: "center",
                  backgroundColor: "#1E293B",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  minWidth: 200,
                  maxWidth: 300,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 12,
                  opacity: tooltipAnim,
                  transform: [
                    {
                      scale: tooltipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                    {
                      translateY: tooltipAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    },
                  ],
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.1)",
                    paddingBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{tooltip.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {tooltip.users.length}{" "}
                    {tooltip.users.length === 1 ? "person" : "people"} reacted
                  </Text>
                </View>

                {/* User list */}
                {tooltip.users.map((u, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      paddingVertical: 4,
                    }}
                  >
                    {/* Mini avatar */}
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: "#7C3AED",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        {u.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#fff",
                        fontWeight: "500",
                      }}
                    >
                      {u.fullName}
                    </Text>
                  </View>
                ))}

                {/* Dismiss hint */}
                <Text
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Tap anywhere to dismiss
                </Text>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────────

interface ReactionPickerProps {
  visible: boolean;
  communicationId: number;
  onClose: () => void;
}

export function ReactionPicker({
  visible,
  communicationId,
  onClose,
}: ReactionPickerProps) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleReactionWithRefresh();

  const handlePick = (emoji: string) => {
    onClose();
    toggleReaction({
      communicationId,
      reactionType: emoji,
      userId: user?.userId,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center px-6 bg-black/50">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reaction picker"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View className="w-full rounded-2xl bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-textPrimary">React</Text>
              <Text className="mt-0.5 text-xs text-textSecondary">
                Choose an emoji
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-surfaceMuted"
              hitSlop={8}
            >
              <AppIcon name="close" size={18} color="#453956" />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handlePick(emoji)}
                style={({ pressed }) => ({
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: pressed ? "#EFE9FF" : "#F8FAFC",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: pressed ? "#DDD6FE" : "#E2E8F0",
                })}
              >
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
