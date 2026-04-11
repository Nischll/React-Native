import React, { useState } from "react";
import { TextInputProps } from "react-native";
import AppInput from "./AppInput";

interface PasswordInputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
}

export default function PasswordInput({
  label,
  error,
  size,
  ...props
}: PasswordInputProps) {
  const [hidden, setHidden] = useState(true);

  return (
    <AppInput
      label={label}
      error={error}
      size={size}
      secureTextEntry={hidden}
      leftIcon="lock-closed-outline"
      rightIcon={hidden ? "eye-off-outline" : "eye-outline"}
      onRightIconPress={() => setHidden((prev) => !prev)}
      {...props}
    />
  );
}
