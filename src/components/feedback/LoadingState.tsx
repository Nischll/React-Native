import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Text, View } from "react-native";

export default function LoadingState({
  message = "Loading...",
}: {
  message?: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // iOS typing dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // logo animation (unchanged)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // iOS typing dots animation
    const createLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    createLoop(dot1, 0).start();
    createLoop(dot2, 120).start();
    createLoop(dot3, 240).start();
  }, []);

  const renderDot = (anim: Animated.Value, key: number) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.4],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    });

    return (
      <Animated.View
        key={key}
        style={{
          width: 4,
          height: 4,
          borderRadius: 4,
          backgroundColor: "#453956",
          marginHorizontal: 4,
          transform: [{ translateY }, { scale }],
          opacity,
        }}
      />
    );
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      {/* Card container */}
      <View
        style={{
          width: "70%",
          maxWidth: 320,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          paddingVertical: 28,
          paddingHorizontal: 20,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E5E7EB",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        {/* Animated Logo */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            marginBottom: 4,
          }}
        >
          <Image
            source={require("@/assets/images/splash-logo.png")}
            style={{
              width: 100,
              height: 64,
              borderRadius: 14,
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* iOS typing dots */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {renderDot(dot1, 0)}
          {renderDot(dot2, 1)}
          {renderDot(dot3, 2)}
        </View>

        {/* Message */}
        <Text
          style={{
            marginTop: 14,
            fontSize: 13,
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}
