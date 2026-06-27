import { useToggleNoticeReaction } from "@/src/api/activity.api,";
import { useAuth } from "@/src/providers/AuthProvider";
import { Notice } from "@/src/types/dashboard.types";
import { Pressable, Text, View } from "react-native";

const EMOJI_OPTIONS = ["👍", "😀", "😍", "🤓", "❤️", "🔥", "👏", "😮"];

export function NoticeReactionBar({
  noticeId,
  reactions,
  onOpenPicker,
}: {
  noticeId: number;
  reactions: Notice["reactions"];
  onOpenPicker: () => void;
}) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleNoticeReaction();

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
                noticeId,
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
              backgroundColor: isMine ? "#FEF3C7" : "#F8FAFC",
              borderWidth: 1,
              borderColor: isMine ? "#F59E0B" : "#E2E8F0",
              transform: [{ scale: pressed ? 0.93 : 1 }],
              gap: 4,
            })}
          >
            <Text style={{ fontSize: 13 }}>{r.reactionType}</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isMine ? "#B45309" : "#64748B",
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

export function NoticeReactionPicker({
  noticeId,
  onClose,
}: {
  noticeId: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { mutate: toggleReaction } = useToggleNoticeReaction();

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FDE68A",
        marginTop: 8,
        marginHorizontal: 4,
      }}
    >
      {EMOJI_OPTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => {
            if (!user?.userId) return;
            toggleReaction(
              { noticeId, reactionType: emoji, userId: user.userId },
              { onSuccess: () => onClose() },
            );
          }}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: pressed ? "#FEF3C7" : "#F8FAFC",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 1.15 : 1 }],
          })}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}
