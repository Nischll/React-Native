import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

type Point = { x: number; y: number };

type SignaturePadProps = {
  /** Fixed width. If omitted, pad fills parent width via onLayout. */
  width?: number;
  height?: number;
  /** Existing signature payload (`SIGNATURE_JSON:...`) to hydrate on edit */
  value?: string;
  onChange?: (value: string) => void;
};

function parseStrokes(value?: string): Point[][] {
  if (!value?.trim() || !value.startsWith("SIGNATURE_JSON:")) return [];
  try {
    const cleaned = value.replace("SIGNATURE_JSON:", "");
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed?.strokes) ? parsed.strokes : [];
  } catch {
    return [];
  }
}

export default function SignaturePad({
  width: widthProp,
  height = 160,
  value,
  onChange,
}: SignaturePadProps) {
  const [, forceRender] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const width = widthProp != null && widthProp > 0 ? widthProp : measuredWidth;

  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const onChangeRef = useRef(onChange);
  const lastHydratedValue = useRef<string | undefined>(undefined);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);
  useEffect(() => {
    heightRef.current = height;
  }, [height]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const strokesRef = useRef<Point[][]>([]);
  const currentStroke = useRef<Point[]>([]);
  const lastRenderTime = useRef(0);

  // Hydrate from parent value (edit mode) without emitting onChange
  useEffect(() => {
    const next = value ?? "";
    if (next === lastHydratedValue.current) return;
    lastHydratedValue.current = next;
    strokesRef.current = parseStrokes(next);
    currentStroke.current = [];
    forceRender((v) => v + 1);
  }, [value]);

  const normalize = (x: number, y: number) => {
    const w = widthRef.current || 1;
    const h = heightRef.current || 1;
    return { x: x / w, y: y / h };
  };

  const emit = (data: Point[][]) => {
    const payload =
      data.length === 0
        ? ""
        : `SIGNATURE_JSON:${JSON.stringify({ strokes: data })}`;
    lastHydratedValue.current = payload;
    onChangeRef.current?.(payload);
  };

  const drawTick = () => {
    const now = Date.now();
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
        drawTick();
      },
      onPanResponderRelease: () => {
        strokesRef.current.push([...currentStroke.current]);
        currentStroke.current = [];
        emit(strokesRef.current);
        forceRender((v) => v + 1);
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

  const onLayout = (e: LayoutChangeEvent) => {
    if (widthProp != null && widthProp > 0) return;
    const next = Math.floor(e.nativeEvent.layout.width);
    if (next > 0 && next !== measuredWidth) {
      setMeasuredWidth(next);
    }
  };

  return (
    <View
      style={{ alignSelf: "stretch", width: "100%", maxWidth: "100%" }}
      onLayout={onLayout}
    >
      {width > 0 ? (
        <>
          <View
            {...panResponder.panHandlers}
            style={{
              width,
              height,
              maxWidth: "100%",
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Svg width={width} height={height}>
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
              backgroundColor: "#DC2626",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Clear</Text>
          </Pressable>
        </>
      ) : (
        <View
          style={{
            height,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 12,
            backgroundColor: "#f8fafc",
          }}
        />
      )}
    </View>
  );
}
