import { useToggleCommentReaction } from "@/src/api/taskManagement.api";
import { useAuth } from "@/src/providers/AuthProvider";
import { CommentResponse } from "@/src/types/task-management.types";
import { Pressable, Text, View } from "react-native";

const EMOJI_OPTIONS = ["👍", "😀", "😍", "🤓", "❤️", "🔥", "👏", "😮"];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: size * 0.35, color: "#fff", fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

export function ReactionBar({
  commentId,
  reactions,
  onOpenPicker,
}: {
  commentId: number;
  reactions: CommentResponse["reactions"];
  onOpenPicker: () => void;
}) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleCommentReaction();

  const myReactions = new Set(
    reactions?.flatMap(
      (r) =>
        r.users
          ?.filter((u) => u.userId === user?.userId)
          .map(() => r.reactionType) ?? [],
    ),
  );

  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}
    >
      {reactions?.map((r) => {
        const isMine = myReactions.has(r.reactionType);
        return (
          <Pressable
            key={r.reactionType}
            onPress={() =>
              user?.userId &&
              toggleReaction({
                commentId,
                reactionType: r.reactionType,
                userId: user.userId,
              })
            }
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: isMine ? "#EFE9FF" : "#F8FAFC",
              borderWidth: 1,
              borderColor: isMine ? "#7C3AED" : "#E2E8F0",
              transform: [{ scale: pressed ? 0.93 : 1 }],
              gap: 4,
            })}
          >
            <Text style={{ fontSize: 13 }}>{r.reactionType}</Text>
            <Text
              style={{
                fontSize: 11,
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
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          paddingHorizontal: 7,
          paddingVertical: 4,
          borderRadius: 99,
          borderWidth: 1.5,
          borderColor: "#E2E8F0",
          borderStyle: "dashed",
          backgroundColor: "#F8FAFC",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 12, color: "#94A3B8" }}>＋</Text>
        <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600" }}>
          React
        </Text>
      </Pressable>
    </View>
  );
}

export function ReactionPicker({
  commentId,
  onClose,
}: {
  commentId: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleCommentReaction();

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
          onPress={() => {
            if (!user?.userId) return;
            toggleReaction(
              { commentId, reactionType: emoji, userId: user.userId },
              { onSuccess: () => onClose() },
            );
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: pressed ? "#EFE9FF" : "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 1.15 : 1 }],
          })}
        >
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
