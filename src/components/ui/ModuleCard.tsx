import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import AppIcon from "./AppIcon";

interface ModuleItem {
  name: string;
  icon: string;
  path?: string | null;
  code: string;
  moduleList?: ModuleItem[];
}

interface ModuleCardProps {
  module: ModuleItem;
  onPress?: (module: ModuleItem) => void;
  depth?: number;
}

export default function ModuleCard({
  module,
  onPress,
  depth = 0,
}: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  const children = module.moduleList ?? [];
  const hasChildren = children.length > 0;

  const handlePress = () => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
      return;
    }

    if (module.path) {
      onPress?.(module);
    }
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        className={`
          flex-row items-center rounded-2xl border border-border bg-surface px-4 py-4
          active:opacity-80
          ${depth > 0 ? "ml-6 mt-2 bg-surfaceMuted" : "mb-3"}
        `}
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }}
      >
        {/* ICON */}
        <View
          className={`
            mr-4 h-12 w-12 items-center justify-center rounded-2xl
            ${depth > 0 ? "bg-primary/5" : "bg-primary/10"}
          `}
        >
          <AppIcon name={module.icon as any} size={22} color="#453956" />
        </View>

        {/* TEXT */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">
            {module.name}
          </Text>

          {hasChildren && (
            <Text className="mt-1 text-xs text-textMuted">
              {children.length} sub modules
            </Text>
          )}
        </View>

        {/* ARROW (ONLY IF CHILDREN EXIST) */}
        {hasChildren ? (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#94A3B8"
          />
        ) : null}
      </Pressable>

      {/* CHILDREN */}
      {expanded && hasChildren && (
        <View className="ml-2">
          {children.map((child) => (
            <ModuleCard
              key={child.code}
              module={child}
              onPress={onPress}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}
