import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface AppIconProps {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}

export default function AppIcon({
  name,
  size = 22,
  color = "#334155",
}: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
