import React from "react";
import { TextInput, View } from "react-native";

export default function TextAreaField({
  value,
  onChangeText,
  placeholder,
}: any) {
  return (
    <View className="w-full">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        numberOfLines={4}
        className="
          rounded-xl
          border border-slate-300
          bg-white
          px-4 py-3
          text-slate-900
          h-28
        "
        textAlignVertical="top"
      />
    </View>
  );
}
