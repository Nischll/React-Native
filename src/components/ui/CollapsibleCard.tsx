import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import AppIcon from "./AppIcon";
import Card from "./Card";

export function CollapsibleCard({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
  children,
  accentColor = "#4F46E5",
}: {
  icon: string;
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: string;
}) {
  // ── Animation values ───────────────────────────────────────────────────────

  // Controls content height: 0 → 1 (we use this to clip the content)
  const heightAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  // Controls content opacity: 0 → 1 (fade in slightly behind height)
  const opacityAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  // Chevron rotation: "0deg" collapsed → "180deg" expanded
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    if (expanded) {
      // Expand: height first, opacity follows slightly after
      Animated.parallel([
        Animated.spring(heightAnim, {
          toValue: 1,
          useNativeDriver: false, // height cannot use native driver
          damping: 20,
          stiffness: 180,
          mass: 0.8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          delay: 60, // slight delay so content fades in after box opens
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 200,
        }),
      ]).start();
    } else {
      // Collapse: opacity first, height follows
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(heightAnim, {
          toValue: 0,
          useNativeDriver: false,
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 200,
        }),
      ]).start();
    }
  }, [expanded]);

  // Measure natural content height so we can interpolate 0 → actualHeight
  const [contentHeight, setContentHeight] = useState(0);

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
    extrapolate: "clamp",
  });

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Card className="px-4 mb-4">
      {/* ── Header — always visible ── */}
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Icon badge */}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: accentColor + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={icon as any} size={16} color={accentColor} />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>
              {title}
            </Text>
            {/* Subtitle fades out when expanded */}
            {subtitle && (
              <Animated.Text
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginTop: 1,
                  // Invert expanded opacity so subtitle hides when open
                  opacity: heightAnim.interpolate({
                    inputRange: [0, 0.4],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                  }),
                }}
              >
                {subtitle}
              </Animated.Text>
            )}
          </View>
        </View>

        {/* Animated chevron */}
        <Animated.View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: chevronRotate }],
          }}
        >
          <AppIcon name="chevron-down" size={14} color="#6B7280" />
        </Animated.View>
      </Pressable>

      {/* ── Animated content wrapper ── */}
      <Animated.View
        style={{
          height: contentHeight === 0 ? undefined : animatedHeight,
          overflow: "hidden",
        }}
      >
        {/* Ghost render to measure real height */}
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) {
              setContentHeight(h);
            }
          }}
        >
          {/* Divider */}
          <View
            style={{
              height: 0.5,
              backgroundColor: "#E5E7EB",
              marginBottom: 14,
            }}
          />

          {/* Content with fade */}
          <Animated.View style={{ opacity: opacityAnim }}>
            {children}
          </Animated.View>
        </View>
      </Animated.View>
    </Card>
  );
}
