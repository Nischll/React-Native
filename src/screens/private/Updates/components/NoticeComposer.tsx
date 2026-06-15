import { useCreateCommunicationWithRefresh } from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { useAuth } from "@/src/providers/AuthProvider";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function stripMentions(text: string): string {
  return text
    .replace(/@[\w._-]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function NoticeComposer() {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [isAllBuildings, setIsAllBuildings] = useState(false);

  const { selectedBuilding } = useAuth();
  const { mutate: create, isPending } = useCreateCommunicationWithRefresh();

  const hasText = text.trim().length > 0;

  const handleMentionSelect = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(Number(id)) ? prev : [...prev, Number(id)],
    );
  };

  const handleToggleAllBuildings = () => {
    const next = !isAllBuildings;
    setIsAllBuildings(next);

    if (next) {
      setText((prev) => stripMentions(prev));
      setSelectedEmployeeIds([]);
      setMentionState(null);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    create(
      {
        message: trimmed,
        parentId: null,
        buildingIds: isAllBuildings
          ? []
          : selectedBuilding
            ? [Number(selectedBuilding.value)]
            : [],
        employeeIds: isAllBuildings ? [] : selectedEmployeeIds,
      },
      {
        onSuccess: () => {
          setText("");
          setExpanded(false);
          setMentionState(null);
          setSelectedEmployeeIds([]);
          setIsAllBuildings(false);
        },
      },
    );
  };

  const handleCancel = () => {
    setText("");
    setExpanded(false);
    setMentionState(null);
    setSelectedEmployeeIds([]);
    setIsAllBuildings(false);
  };

  return (
    <View style={{ marginHorizontal: 6, marginBottom: 12 }}>
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
            {/* ── All Buildings toggle ── */}
            <TouchableOpacity
              onPress={handleToggleAllBuildings}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 99,
                borderWidth: 1.5,
                borderColor: isAllBuildings ? "#7C3AED" : "#E2E8F0",
                backgroundColor: isAllBuildings ? "#F5F3FF" : "#FAFAFA",
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: isAllBuildings ? "#7C3AED" : "#CBD5E1",
                  backgroundColor: isAllBuildings ? "#7C3AED" : "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isAllBuildings && (
                  <AppIcon name="checkmark" size={10} color="#fff" />
                )}
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isAllBuildings ? "#7C3AED" : "#64748B",
                }}
              >
                All Buildings
              </Text>
            </TouchableOpacity>

            {/* ── Message input ── */}
            <MentionTextInput
              value={text}
              onChangeText={setText}
              onMentionStateChange={
                isAllBuildings ? undefined : setMentionState
              }
              placeholder={
                isAllBuildings
                  ? "Enter message… (mentions disabled for all buildings)"
                  : "Enter message…. Type @ to mention someone"
              }
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

            {/* Mention suggestions  */}
            {mentionState && !isAllBuildings && (
              <MentionSuggestions
                mentionState={mentionState}
                value={text}
                onChangeText={setText}
                onDismiss={() => setMentionState(null)}
                direction="below"
                onMentionSelect={handleMentionSelect}
              />
            )}

            {/* ── Scope indicator ── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginBottom: 8,
              }}
            >
              <AppIcon
                name={isAllBuildings ? "globe-outline" : "business-outline"}
                size={12}
                color="#94A3B8"
              />
              <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                {isAllBuildings
                  ? "Sending to all buildings"
                  : `Sending to ${selectedBuilding?.label ?? "current building"}`}
              </Text>
            </View>

            {/* ── Actions ── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                paddingTop: 4,
              }}
            >
              <Pressable
                onPress={handleCancel}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: "#F1F5F9",
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#64748B" }}
                >
                  Cancel
                </Text>
              </Pressable>

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

        {/* Collapsed placeholder */}
        {!expanded && !hasText && (
          <Pressable
            onPress={() => setExpanded(true)}
            style={{ paddingHorizontal: 14, paddingBottom: 14 }}
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
