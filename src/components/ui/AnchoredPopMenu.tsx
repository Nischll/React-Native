import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import AppIcon from "./AppIcon";

export type MenuItem = {
  label: string;
  danger?: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

type Props = {
  items: MenuItem[];
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const MENU_WIDTH = 190;
const GAP = 2;
const SCREEN_PADDING = 38;

const ARROW_SIZE = 12;
const ARROW_OFFSET = ARROW_SIZE / 2;

export default function AnchoredPopupMenu({ items }: Props) {
  const triggerRef = useRef<any>(null);

  const [visible, setVisible] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
    openUpward: false,
  });

  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const animateOpen = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      callback?.();
    });
  };

  const openMenu = () => {
    triggerRef.current?.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        let left = x;
        let top = y + GAP - ARROW_OFFSET;
        let openUpward = false;

        if (left + MENU_WIDTH > SCREEN_WIDTH - SCREEN_PADDING) {
          left = SCREEN_WIDTH - MENU_WIDTH - SCREEN_PADDING;
        }

        if (left < SCREEN_PADDING) {
          left = SCREEN_PADDING;
        }

        if (top + menuHeight > SCREEN_HEIGHT - SCREEN_PADDING) {
          top = y - menuHeight - GAP + ARROW_OFFSET;
          openUpward = true;
        }

        if (top < SCREEN_PADDING) {
          top = SCREEN_PADDING;
        }

        setPosition({
          x: left,
          y: top,
          openUpward,
        });

        scaleAnim.setValue(0.92);
        opacityAnim.setValue(0);

        setVisible(true);

        requestAnimationFrame(animateOpen);
      },
    );
  };

  return (
    <>
      {/* Trigger */}
      <Pressable ref={triggerRef} onPress={openMenu} className="py-2 px-1">
        <AppIcon name="ellipsis-vertical" color="#6B7280" size={18} />
      </Pressable>

      {/* Popup */}
      <Modal
        transparent
        visible={visible}
        onRequestClose={() => animateClose()}
      >
        <View style={{ flex: 1 }}>
          {/* Overlay */}
          <TouchableWithoutFeedback onPress={() => animateClose()}>
            <View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
            />
          </TouchableWithoutFeedback>

          {/* Menu */}
          <Animated.View
            onLayout={(e) => {
              setMenuHeight(e.nativeEvent.layout.height);
            }}
            style={{
              position: "absolute",
              top: position.y,
              left: position.x,
              width: MENU_WIDTH,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: "#453956",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: "#5B4A70",
              paddingVertical: 6,
            }}
          >
            {/* Arrow */}
            <View
              style={{
                position: "absolute",
                right: 14,
                width: 12,
                height: 12,
                backgroundColor: "#453956",
                transform: [{ rotate: "45deg" }],
                borderLeftWidth: 1,
                borderTopWidth: 1,
                borderColor: "#5B4A70",
                ...(position.openUpward ? { bottom: -6 } : { top: -6 }),
              }}
            />

            {/* Items */}
            {items.map((item, index) => {
              const color = item.danger ? "#F87171" : "#F3F4F6";

              return (
                <Pressable
                  key={index}
                  onPress={() => animateClose(item.onPress)}
                  className="flex-row items-center gap-2 px-2 py-2.5 active:bg-white/10"
                >
                  {/* Icon */}
                  {item.icon ? (
                    <AppIcon name={item.icon} size={13} color={color} />
                  ) : null}

                  {/* Label */}
                  <Text
                    style={{
                      color,
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
