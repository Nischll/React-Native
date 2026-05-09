import {
  Reaction,
  useToggleReactionWithRefresh,
} from "@/src/api/communication.api";
import { useAuth } from "@/src/providers/AuthProvider";
import { Pressable, Text, View } from "react-native";

const EMOJI_OPTIONS = ["👍", "😀", "😍", "🤓", "❤️", "🔥", "👏", "😮"];

interface ReactionBarProps {
  communicationId: number;
  reactions: Reaction[];
  onOpenPicker: () => void;
}

export function ReactionBar({
  communicationId,
  reactions,
  onOpenPicker,
}: ReactionBarProps) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleReactionWithRefresh();

  const myReactions = new Set(
    reactions.flatMap((r) =>
      r.users
        .filter((u) => u.userId === user?.userId)
        .map(() => r.reactionType),
    ),
  );

  const handleReact = async (emoji: string) => {
    if (!user?.userId) return;

    toggleReaction(
      {
        communicationId,
        reactionType: emoji,
        userId: user.userId,
      },
      {
        onError: (err) => {
          console.log(err);
        },
      },
    );
  };

  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}
    >
      {reactions.map((r) => {
        const isMine = myReactions.has(r.reactionType);
        return (
          <Pressable
            key={r.reactionType}
            onPress={() => handleReact(r.reactionType)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isMine ? "#EFE9FF" : "#F8FAFC",
              borderWidth: 1,
              borderColor: isMine ? "#7C3AED" : "#E2E8F0",
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            <Text style={{ fontSize: 16 }}>{r.reactionType}</Text>
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

      {/* Add reaction button */}
      <Pressable
        onPress={onOpenPicker}
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
  );
}

// ─── Picker (rendered inside Modal by parent) ─────────────────────────────────

interface ReactionPickerProps {
  communicationId: number;
  onClose: () => void;
}

export function ReactionPicker({
  communicationId,
  onClose,
}: ReactionPickerProps) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleReactionWithRefresh();

  const handlePick = (emoji: string) => {
    if (!user?.userId) return;
    toggleReaction(
      { communicationId, reactionType: emoji, userId: user.userId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      {EMOJI_OPTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => handlePick(emoji)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: pressed ? "#F1F5F9" : "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
