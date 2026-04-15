import React from "react";
import { Path } from "react-native-svg";

export const renderSignature = (dataString: string) => {
  try {
    if (!dataString) return null;

    const cleaned = dataString.replace("SIGNATURE_JSON:", "");
    const parsed = JSON.parse(cleaned);

    const scaleX = 300;
    const scaleY = 150;

    return parsed.strokes.map((stroke: any[], i: number) => {
      if (!stroke.length) return null;

      const d = stroke
        .map((p, index) => {
          const x = p.x * scaleX;
          const y = p.y * scaleY;
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");

      return (
        <Path
          key={i}
          d={d}
          stroke="#111"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    });
  } catch (e) {
    console.log("Signature parse error:", e);
    return null;
  }
};
