import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";

import { Portal } from "react-native-paper";
import { EmployeeOption, useEmployeeOptions } from "../hooks/useEmployee";
import { useAuth } from "../providers/AuthProvider";

interface MentionTextInputProps extends TextInputProps {
  containerClassName?: string;
  suggestionContainerClassName?: string;
  suggestionItemClassName?: string;
  onMentionSelect?: (user: EmployeeOption) => void;
}

export const MentionTextInput = forwardRef<TextInput, MentionTextInputProps>(
  (
    {
      value = "",
      onChangeText,
      multiline = true,
      className,
      containerClassName,
      suggestionContainerClassName,
      suggestionItemClassName,
      onMentionSelect,
      ...rest
    },
    ref,
  ) => {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const { employees } = useEmployeeOptions(1, 100);

    const inputRef = useRef<TextInput>(null);
    const [layout, setLayout] = useState<null | {
      x: number;
      y: number;
      width: number;
      height: number;
    }>(null);

    const mentionMatch = value.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
    const showSuggestions = !!mentionMatch;

    const filteredUsers = useMemo(() => {
      if (!mentionMatch) return [];

      const query = mentionMatch[1].toLowerCase();

      return employees.filter((u) => {
        const isSelf =
          u.username === user?.username || u.value === String(user?.userId);

        if (isSelf) return false;

        return (
          u.label.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query)
        );
      });
    }, [employees, mentionMatch, user]);

    const updateLayout = () => {
      inputRef.current?.measureInWindow((x, y, width, height) => {
        setLayout({ x, y, width, height });
      });
    };

    useEffect(() => {
      if (showSuggestions) {
        requestAnimationFrame(updateLayout);
      }
    }, [value]);

    const handleChange = (text: string) => {
      onChangeText?.(text);
    };

    const handleSelectUser = (user: EmployeeOption) => {
      const updatedText = value.replace(
        /(?:^|\s)@([a-zA-Z0-9._-]*)$/,
        ` @${user.username} `,
      );

      onChangeText?.(updatedText);
      onMentionSelect?.(user);
    };

    return (
      <View className={`relative ${containerClassName || ""}`}>
        <TextInput
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          value={value}
          onChangeText={handleChange}
          multiline={multiline}
          className={className}
          onFocus={updateLayout}
          {...rest}
        />

        {showSuggestions && filteredUsers.length > 0 && (
          <Portal>
            <View
              style={{
                position: "absolute",
                top: (layout?.y ?? 0) + (layout?.height ?? 0) + 18,
                left: layout?.x ?? 16,
                width: layout?.width ?? width - 32,

                maxHeight: 220,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 12,

                zIndex: 9999,
                elevation: 30,

                overflow: "hidden",
              }}
              className={suggestionContainerClassName}
            >
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => String(item.value)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectUser(item)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F1F5F9",
                    }}
                    className={suggestionItemClassName}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600" }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748B" }}>
                      @{item.username}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Portal>
        )}
      </View>
    );
  },
);

MentionTextInput.displayName = "MentionTextInput";
