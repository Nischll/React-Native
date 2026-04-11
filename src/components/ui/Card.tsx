import React from "react";
import { View, ViewProps } from "react-native";

type CardVariant = "default" | "glass" | "outlined" | "soft";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padded?: boolean;
  variant?: CardVariant;
  className?: string;
}

export default function Card({
  children,
  padded = true,
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  const variantStyles: Record<CardVariant, string> = {
    default: "bg-surface border border-border shadow-sm",
    glass: "bg-surface/70 border border-border/50",
    outlined: "bg-transparent border border-border",
    soft: "bg-surfaceMuted border border-border",
  };

  return (
    <View
      className={`
        rounded-xl
        ${padded ? "p-4" : ""}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}
