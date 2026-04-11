import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  Text,
  View,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends PressableProps {
  children?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;

  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];

  iconOnly?: boolean;
}

export default function AppButton({
  children,
  loading = false,
  loadingText,
  disabled = false,
  variant = "primary",
  size = "md",
  fullWidth = true,
  leftIcon,
  rightIcon,
  iconOnly = false,
  ...props
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "border border-border bg-surface",
    danger: "bg-danger",
    ghost: "bg-transparent",
  };

  const textStyles: Record<ButtonVariant, string> = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-textPrimary",
    danger: "text-white",
    ghost: "text-primary",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: iconOnly ? "h-9 w-9 rounded-lg" : "px-3 py-2 rounded-lg",
    md: iconOnly ? "h-11 w-11 rounded-xl" : "px-5 py-3 rounded-xl",
    lg: iconOnly ? "h-14 w-14 rounded-2xl" : "px-6 py-4 rounded-2xl",
  };

  const textSizeStyles: Record<ButtonSize, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const iconSizeMap: Record<ButtonSize, number> = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const iconColor =
    variant === "outline" || variant === "ghost" ? "#453956" : "#FFFFFF";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`
          ${fullWidth && !iconOnly ? "w-full" : ""}
          items-center justify-center
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${isDisabled ? "opacity-70" : ""}
        `}
        {...props}
      >
        {loading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color={iconColor} size="small" />
            {loadingText ? (
              <Text
                className={`font-semibold ${textStyles[variant]} ${textSizeStyles[size]}`}
              >
                {loadingText}
              </Text>
            ) : null}
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={iconSizeMap[size]}
                color={iconColor}
              />
            )}

            {!iconOnly && children ? (
              <Text
                className={`font-semibold ${textStyles[variant]} ${textSizeStyles[size]}`}
              >
                {children}
              </Text>
            ) : null}

            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={iconSizeMap[size]}
                color={iconColor}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
