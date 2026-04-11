import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import AppIcon from "./AppIcon";

export interface SelectOption {
  label: string;
  value: string;
}
type SelectSize = "sm" | "md" | "lg";

interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  size?: SelectSize;
}

export default function SelectField({
  label,
  value,
  placeholder = "Select option",
  options,
  onChange,
  error,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="w-full">
      {/* Label */}
      {label && (
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          {label}
        </Text>
      )}

      {/* Select Button */}
      <Pressable
        onPress={() => setOpen(true)}
        className={`
          flex-row items-center justify-between
          rounded-xl
          border
          px-4 py-3
          bg-white
          ${error ? "border-red-400" : "border-slate-300"}
        `}
      >
        <Text className={selectedLabel ? "text-slate-900" : "text-slate-400"}>
          {selectedLabel || placeholder}
        </Text>

        <AppIcon name="chevron-down" size={18} color="#64748B" />
      </Pressable>

      {/* Error */}
      {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}

      {/* Modal */}
      <Modal visible={open} animationType="slide">
        <View className="flex-1 bg-white p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-slate-900">
              Select {label}
            </Text>

            <Pressable onPress={() => setOpen(false)}>
              <Text className="text-primary font-semibold">Close</Text>
            </Pressable>
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            className="mb-4 rounded-xl border border-slate-300 px-4 py-3"
          />

          {/* Options */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="py-4 border-b border-slate-100"
              >
                <Text className="text-slate-900 text-base">{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
