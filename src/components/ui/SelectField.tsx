import React, { useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppIcon from "./AppIcon";

export interface SelectOption {
  label: string;
  value: string;
}

interface SingleSelectProps {
  multi?: false;
  value?: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps {
  multi: true;
  value?: string[];
  onChange: (value: string[]) => void;
}

type SelectFieldProps = {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  error?: string;
  mode?: "modal" | "dropdown";
} & (SingleSelectProps | MultiSelectProps);

export default function SelectField(props: SelectFieldProps) {
  const {
    label,
    placeholder = "Select option",
    options,
    error,
    mode = "modal",
    multi = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const selectedValues: string[] = multi
    ? ((props.value as string[]) ?? [])
    : props.value
      ? [props.value as string]
      : [];

  const selectedLabels = selectedValues.map(
    (v) => options.find((o) => o.value === v)?.label ?? v,
  );

  const isSelected = (val: string) => selectedValues.includes(val);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Select all ───────────────────────────────────────────
  const allSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((o) => selectedValues.includes(o.value));

  const handleSelectAll = () => {
    if (!multi) return;
    if (allSelected) {
      const filteredValues = filteredOptions.map((o) => o.value);
      (props.onChange as (v: string[]) => void)(
        selectedValues.filter((v) => !filteredValues.includes(v)),
      );
    } else {
      const merged = Array.from(
        new Set([...selectedValues, ...filteredOptions.map((o) => o.value)]),
      );
      (props.onChange as (v: string[]) => void)(merged);
    }
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleSelect = (val: string) => {
    if (multi) {
      const current = (props.value as string[]) ?? [];
      const next = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];
      (props.onChange as (v: string[]) => void)(next);
    } else {
      (props.onChange as (v: string) => void)(val);
      closeDropdown();
      setOpen(false);
      setSearch("");
    }
  };

  const removeChip = (val: string) => {
    if (!multi) return;
    const current = (props.value as string[]) ?? [];
    (props.onChange as (v: string[]) => void)(current.filter((v) => v !== val));
  };

  // ── Animations ───────────────────────────────────────────
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

  // ── Select all row ───────────────────────────────────────
  const renderSelectAll = () => {
    if (!multi || filteredOptions.length === 0) return null;
    return (
      <Pressable
        onPress={handleSelectAll}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1.5,
          borderBottomColor: "#E2E8F0",
          backgroundColor: allSelected ? "#F5F3FF" : "#FAFAFA",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: allSelected ? "#7C3AED" : "#0F172A",
          }}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Text>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: allSelected ? "#7C3AED" : "#CBD5E1",
            backgroundColor: allSelected ? "#7C3AED" : "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {allSelected && <AppIcon name="checkmark" size={12} color="#fff" />}
        </View>
      </Pressable>
    );
  };

  // ── Trigger button ───────────────────────────────────────
  const renderTrigger = () => {
    const onPress = mode === "dropdown" ? openDropdown : () => setOpen(true);

    if (multi && selectedValues.length > 0) {
      const visibleChips = selectedLabels.slice(0, 2);
      const overflowCount = selectedValues.length - 2;

      return (
        <Pressable
          onPress={onPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "nowrap",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: error ? "#F87171" : "#CBD5E1",
            backgroundColor: "#fff",
            paddingHorizontal: 10,
            paddingVertical: 8,
            gap: 6,
            minHeight: 48,
          }}
        >
          {visibleChips.map((chipLabel, i) => (
            <View
              key={selectedValues[i]}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#EDE9FE",
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 3,
                flexShrink: 1,
                maxWidth: 110,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: "#7C3AED",
                  fontWeight: "600",
                  flexShrink: 1,
                }}
              >
                {chipLabel}
              </Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  removeChip(selectedValues[i]);
                }}
                hitSlop={6}
              >
                <AppIcon name="close-circle" size={13} color="#7C3AED" />
              </Pressable>
            </View>
          ))}

          {overflowCount > 0 && (
            <View
              style={{
                backgroundColor: "#7C3AED",
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 12, color: "#fff", fontWeight: "700" }}>
                +{overflowCount}
              </Text>
            </View>
          )}

          <Animated.View
            style={{ transform: [{ rotate }], marginLeft: "auto" }}
          >
            <AppIcon name="chevron-down" size={18} color="#64748B" />
          </Animated.View>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? "#F87171" : "#CBD5E1",
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            color: selectedLabels[0] ? "#0F172A" : "#94A3B8",
            fontSize: 14,
          }}
        >
          {selectedLabels[0] || placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <AppIcon name="chevron-down" size={18} color="#64748B" />
        </Animated.View>
      </Pressable>
    );
  };

  // ── Option row ───────────────────────────────────────────
  const renderOption = (item: SelectOption, onPress: () => void) => {
    const selected = isSelected(item.value);
    return (
      <Pressable
        key={item.value}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
          backgroundColor: selected ? "#F5F3FF" : "#fff",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: selected ? "#7C3AED" : "#0F172A",
            fontWeight: selected ? "600" : "400",
          }}
        >
          {item.label}
        </Text>
        {multi ? (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: selected ? "#7C3AED" : "#CBD5E1",
              backgroundColor: selected ? "#7C3AED" : "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && <AppIcon name="checkmark" size={12} color="#fff" />}
          </View>
        ) : (
          selected && <AppIcon name="checkmark" size={16} color="#7C3AED" />
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text
          style={{
            marginBottom: 8,
            fontSize: 14,
            fontWeight: "600",
            color: "#334155",
          }}
        >
          {label}
        </Text>
      ) : null}

      <View onLayout={measure}>{renderTrigger()}</View>

      {error ? (
        <Text style={{ marginTop: 6, fontSize: 13, color: "#EF4444" }}>
          {error}
        </Text>
      ) : null}

      {/* ── Modal mode ── */}
      {mode === "modal" && (
        <Modal visible={open} animationType="slide" statusBarTranslucent>
          <SafeAreaView
            style={{ flex: 1, backgroundColor: "#fff" }}
            edges={["top", "bottom", "left", "right"]}
          >
            <View style={{ flex: 1, padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}
                >
                  {label ? `Select ${label}` : "Select"}
                </Text>
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: "#7C3AED",
                  }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}
                  >
                    {multi
                      ? `Done${selectedValues.length > 0 ? ` (${selectedValues.length})` : ""}`
                      : "Close"}
                  </Text>
                </Pressable>
              </View>

              <TextInput
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
                style={{
                  marginBottom: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 14,
                }}
              />

              <ScrollView showsVerticalScrollIndicator={false}>
                {renderSelectAll()}
                {filteredOptions.map((item) =>
                  renderOption(item, () => handleSelect(item.value)),
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {/* ── Dropdown mode ── */}
      {mode === "dropdown" && open && (
        <Modal transparent animationType="none">
          <Pressable onPress={closeDropdown} style={{ flex: 1 }} />
          <View
            style={{
              position: "absolute",
              left: layout.x,
              width: layout.width,
              top:
                layout.y + layout.height + 6 > 600
                  ? layout.y - 180
                  : layout.y + layout.height,
            }}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateAnim }],
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                backgroundColor: "#fff",
                overflow: "hidden",
                maxHeight: 240,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderSelectAll()}
                {options.map((item) =>
                  renderOption(item, () => handleSelect(item.value)),
                )}
              </ScrollView>
              {multi && (
                <Pressable
                  onPress={closeDropdown}
                  style={{
                    padding: 12,
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: "#F1F5F9",
                    backgroundColor: "#FAFAFA",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#7C3AED",
                    }}
                  >
                    Done
                    {selectedValues.length > 0
                      ? ` (${selectedValues.length})`
                      : ""}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}
