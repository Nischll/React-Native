import React from "react";
import {
  Platform,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type Props = TextInputProps & {
  label?: string;
};

export default function TextAreaField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  style,
  ...rest
}: Props) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-2 text-base font-semibold text-slate-700">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholderTextColor="#94A3B8"
        underlineColorAndroid="transparent"
        className={`
          rounded-xl
          border border-slate-300
          px-4
          text-base text-slate-900
          ${editable ? "bg-white" : "bg-slate-100"}
        `}
        style={[
          {
            minHeight: 112,
            paddingTop: Platform.OS === "ios" ? 12 : 10,
            paddingBottom: Platform.OS === "ios" ? 12 : 10,
            fontSize: 16,
            lineHeight: Platform.OS === "ios" ? 22 : undefined,
            color: "#0F172A",
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}
