import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function DatePickerField({ value, onChange }: any) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3"
      >
        <Text className="text-slate-900">
          {value ? value.toString() : "Select Date"}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-4 rounded-t-2xl">
            <Text className="text-center text-lg font-semibold">
              Date Picker (Hook real picker later)
            </Text>

            <Pressable
              onPress={() => {
                onChange(new Date().toISOString().split("T")[0]);
                setOpen(false);
              }}
              className="mt-4 bg-primary py-3 rounded-xl"
            >
              <Text className="text-white text-center">Select Today</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
