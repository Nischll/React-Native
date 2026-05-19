import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export function NoticeComposer() {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);

  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    create(
      { message: trimmed, parentId: null },
      {
        onSuccess: () => {
          setText("");
          setExpanded(false);
          setMentionState(null);
        },
      },
    );
  };

  return (
    <View style={{ marginHorizontal: 6, marginBottom: 12 }}>
      {/* ───── Composer Card ───── */}
      <View
        style={{
          borderRadius: 16,
          borderWidth: expanded ? 1.5 : 1,
          borderColor: expanded ? "#7C3AED" : "#E2E8F0",
          backgroundColor: "#fff",
          shadowColor: "#64748B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Header */}
        <Pressable
          onPress={() => setExpanded(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: expanded ? 6 : 14,
          }}
        >
          <AppIcon name="megaphone-outline" size={16} color="#7C3AED" />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#7C3AED",
              letterSpacing: 0.3,
            }}
          >
            POST A MESSAGE
          </Text>
        </Pressable>

        {/* Expanded area */}
        {(expanded || hasText) && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <MentionTextInput
              value={text}
              onChangeText={setText}
              onMentionStateChange={setMentionState}
              placeholder="Share an update with the team…"
              placeholderTextColor="#CBD5E1"
              multiline
              autoFocus={expanded}
              style={{
                fontSize: 14,
                color: "#1E293B",
                minHeight: 72,
                maxHeight: 160,
                lineHeight: 22,
                marginBottom: 10,
              }}
            />

            {mentionState && (
              // <View style={{ zIndex: 999 }}>
              <MentionSuggestions
                mentionState={mentionState}
                value={text}
                onChangeText={setText}
                onDismiss={() => setMentionState(null)}
                direction="below"
              />
              // </View>
            )}

            {/* Actions */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                paddingHorizontal: 12,
                paddingBottom: 10,
                paddingTop: 10,
              }}
            >
              {/* Cancel */}
              <Pressable
                onPress={() => {
                  setText("");
                  setExpanded(false);
                  setMentionState(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: "#F1F5F9",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#64748B",
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              {/* Post */}
              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || isPending}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor:
                    !text.trim() || isPending ? "#E2E8F0" : "#7C3AED",
                }}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <AppIcon
                    name="send"
                    size={14}
                    color={!text.trim() ? "#94A3B8" : "#fff"}
                  />
                )}

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: !text.trim() || isPending ? "#94A3B8" : "#fff",
                  }}
                >
                  {isPending ? "Posting…" : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Placeholder */}
        {!expanded && !hasText && (
          <Pressable
            onPress={() => setExpanded(true)}
            style={{
              paddingHorizontal: 14,
              paddingBottom: 14,
            }}
          >
            <Text style={{ fontSize: 14, color: "#CBD5E1" }}>
              Share an update with the team…
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
