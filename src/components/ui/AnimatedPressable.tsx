import React, { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleSheet } from "react-native";

interface Props extends PressableProps {
  children: React.ReactNode;
}

export default function AnimatedPressable({ children, ...props }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(overlay, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(overlay, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return (
    <Pressable {...props} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        {/* Content */}
        {children}

        {/* 🔥 Press overlay effect */}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "#000",
            opacity: overlay.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.04], // subtle dark press effect
            }),
            borderRadius: 12, // match your card radius
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
