import React, { useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Point = { x: number; y: number };

export default function SignaturePad({
  width = 320,
  height = 180,
  onChange,
}: any) {
  const [, forceRender] = useState(0);

  const strokesRef = useRef<Point[][]>([]);
  const currentStroke = useRef<Point[]>([]);
  const lastRenderTime = useRef(0);

  const normalize = (x: number, y: number) => ({
    x: x / width,
    y: y / height,
  });

  const emit = (data: Point[][]) => {
    const payload =
      data.length === 0
        ? ""
        : `SIGNATURE_JSON:${JSON.stringify({ strokes: data })}`;

    onChange?.(payload);
  };

  const drawTick = () => {
    const now = Date.now();

    // throttle to ~60fps (16ms)
    if (now - lastRenderTime.current > 16) {
      lastRenderTime.current = now;
      forceRender((v) => v + 1);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentStroke.current = [normalize(locationX, locationY)];
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;

        currentStroke.current.push(normalize(locationX, locationY));

        drawTick(); // 🔥 live update
      },

      onPanResponderRelease: () => {
        strokesRef.current.push([...currentStroke.current]);
        currentStroke.current = [];

        emit(strokesRef.current);

        forceRender((v) => v + 1); // final render
      },
    }),
  ).current;

  const clear = () => {
    strokesRef.current = [];
    currentStroke.current = [];
    emit([]);
    forceRender((v) => v + 1);
  };

  const drawPath = (stroke: Point[]) =>
    stroke
      .map((p, i) => {
        const x = p.x * width;
        const y = p.y * height;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  return (
    <View style={{ width }}>
      <View
        {...panResponder.panHandlers}
        style={{
          width,
          height,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <Svg width={width} height={height}>
          {/* live stroke */}
          {currentStroke.current.length > 1 && (
            <Path
              d={drawPath(currentStroke.current)}
              stroke="black"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* committed strokes */}
          {strokesRef.current.map((s, i) => (
            <Path
              key={i}
              d={drawPath(s)}
              stroke="black"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>

      <Pressable
        onPress={clear}
        style={{
          marginTop: 10,
          alignSelf: "flex-end",
          backgroundColor: "red",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Clear</Text>
      </Pressable>
    </View>
  );
}
