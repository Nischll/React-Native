import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label?: string;
};

export default function TextAreaField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
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
        className={`
          rounded-xl
          border border-slate-300
          px-4 py-3
          text-slate-900
          h-28
          ${editable ? "bg-white" : "bg-slate-100"}
        `}
        textAlignVertical="top"
        {...rest}
      />
    </View>
  );
}
