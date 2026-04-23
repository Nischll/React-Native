import React, { useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
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

interface SelectFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  mode?: "modal" | "dropdown";
}

export default function SelectField({
  label,
  value,
  placeholder = "Select option",
  options,
  onChange,
  error,
  mode = "modal",
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [layout, setLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  // animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const openDropdown = () => {
    setOpen(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: -8,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setSearch("");
    });
  };

  const measure = (e: LayoutChangeEvent) => {
    (e.target as any).measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        setLayout({ x, y, width, height });
      },
    );
  };

  return (
    <View className="w-full">
      {/* LABEL */}
      {label && (
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          {label}
        </Text>
      )}

      {/* FIELD */}
      <View onLayout={measure}>
        <Pressable
          onPress={mode === "dropdown" ? openDropdown : () => setOpen(true)}
          className={`flex-row items-center justify-between rounded-xl border px-4 py-3 bg-white ${
            error ? "border-red-400" : "border-slate-300"
          }`}
        >
          <Text className={selectedLabel ? "text-slate-900" : "text-slate-400"}>
            {selectedLabel || placeholder}
          </Text>

          <Animated.View style={{ transform: [{ rotate }] }}>
            <AppIcon name="chevron-down" size={18} color="#64748B" />
          </Animated.View>
        </Pressable>
      </View>

      {/* ERROR */}
      {error && <Text className="mt-2 text-sm text-red-500">{error}</Text>}

      {/* ================= MODAL MODE (UNCHANGED EXACTLY) ================= */}
      {mode === "modal" && (
        <Modal visible={open} animationType="slide">
          <View className="flex-1 bg-white p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-slate-900">
                Select {label}
              </Text>

              <Pressable onPress={() => setOpen(false)}>
                <Text className="text-primary font-semibold">Close</Text>
              </Pressable>
            </View>

            <TextInput
              placeholder="Search..."
              value={search}
              onChangeText={setSearch}
              className="mb-4 rounded-xl border border-slate-300 px-4 py-3"
            />

            {filteredOptions.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="py-4 border-b border-slate-100"
              >
                <Text className="text-slate-900 text-base">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Modal>
      )}

      {mode === "dropdown" && open && (
        <Modal transparent animationType="none">
          {/* OUTSIDE CLICK */}
          <Pressable onPress={closeDropdown} className="flex-1" />

          {/* DROPDOWN */}
          <View
            style={{
              position: "absolute",
              left: layout.x,
              width: layout.width,
              top:
                layout.y + layout.height + 6 > 600
                  ? layout.y - 180 // OPEN UPWARD
                  : layout.y + layout.height, // OPEN DOWNWARD
            }}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
              }}
              className="rounded-b-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
            >
              {options.map((item) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      onChange(item.value);
                      closeDropdown();
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      isSelected ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <Text
                      className={
                        isSelected ? "text-primary font-bold" : "text-slate-900"
                      }
                    >
                      {item.label}
                    </Text>

                    {isSelected && (
                      <AppIcon name="checkmark" size={16} color="#2563EB" />
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
