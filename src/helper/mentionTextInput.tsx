import { useEmployeeOptions } from "@/src/hooks/useEmployee";
import { useAuth } from "@/src/providers/AuthProvider";
import React, { forwardRef, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

// ─── Types ───────────────────────────────────────────────

export interface MentionState {
  query: string;
  startIndex: number;
}

interface MentionTextInputProps extends TextInputProps {
  onMentionStateChange: (state: MentionState | null) => void;
}

// ─── TextInput ───────────────────────────────────────────
export const MentionTextInput = forwardRef<TextInput, MentionTextInputProps>(
  ({ value = "", onChangeText, onMentionStateChange, ...rest }, ref) => {
    const handleChangeText = (text: string) => {
      onChangeText?.(text);

      const match = text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);

      if (match) {
        const atIndex = text.lastIndexOf("@");

        onMentionStateChange({
          query: match[1],
          startIndex: atIndex,
        });
      } else {
        onMentionStateChange(null);
      }
    };

    return (
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChangeText}
        {...rest}
      />
    );
  },
);

MentionTextInput.displayName = "MentionTextInput";

// ─── Suggestions ─────────────────────────────────────────

interface MentionSuggestionsProps {
  mentionState: MentionState | null;
  value: string;
  onChangeText: (text: string) => void;
  onDismiss: () => void;
  direction?: "above" | "below";
  containerStyle?: StyleProp<ViewStyle>;
  onMentionSelect?: (id: string) => void;
}

export function MentionSuggestions({
  mentionState,
  value,
  onChangeText,
  onDismiss,
  direction = "below",
  containerStyle,
  onMentionSelect,
}: MentionSuggestionsProps) {
  const { user } = useAuth();
  const { employees, isLoading } = useEmployeeOptions(1, 100);

  const filtered = useMemo(() => {
    if (!mentionState) return [];

    const q = mentionState.query.toLowerCase();

    return employees.filter((e) => {
      if (e.value === String(user?.userId) || e.username === user?.username) {
        return false;
      }

      return (
        e.label.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q)
      );
    });
  }, [employees, mentionState, user]);

  if (!mentionState || filtered.length === 0) return null;

  const handleSelect = (emp: any) => {
    const updated = value.replace(/(?:^|\s)@([a-zA-Z0-9._-]*)$/, (m) => {
      const leading = m.startsWith(" ") ? " " : "";
      return `${leading}@${emp.username} `;
    });

    onChangeText(updated);
    onMentionSelect?.(emp.value);
    onDismiss();
  };

  return (
    <View
      style={[
        {
          backgroundColor: "#fff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          maxHeight: 240,
          overflow: "hidden",
          marginTop: direction === "below" ? 4 : undefined,
          marginBottom: direction === "above" ? 6 : undefined,
        },
        containerStyle,
      ]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
          backgroundColor: "#FAFAFA",
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#7C3AED" }}>
          @ Mention
        </Text>

        {isLoading && (
          <ActivityIndicator
            size="small"
            color="#7C3AED"
            style={{ marginLeft: "auto" }}
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.value}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => {
          const getInitials = (name: string) => {
            if (!name) return "?";

            const parts = name.trim().split(" ");

            const first = parts[0]?.charAt(0) || "";
            const last = parts[1]?.charAt(0) || "";

            return (first + last).toUpperCase();
          };

          return (
            <Pressable
              onPress={() => handleSelect(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 4,
                gap: 10,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9",
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#7C3AED",
                  }}
                >
                  {getInitials(item.label)}
                </Text>
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontWeight: "600", color: "#111827", fontSize: 12 }}
                >
                  {item.label}
                </Text>

                <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                  @{item.username}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
