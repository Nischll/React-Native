import React from "react";
import { Switch, Text, View } from "react-native";

export default function SwitchField({ label, value, onChange }: any) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-slate-700 font-medium">{label}</Text>

      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
