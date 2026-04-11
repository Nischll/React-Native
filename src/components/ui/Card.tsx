import React from "react";
import { View } from "react-native";

export default function Card({ children, className = "" }: any) {
  return (
    <View
      className={`
        bg-white
        border border-slate-100
        rounded-2xl
        shadow-sm
        ${className}
      `}
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      {children}
    </View>
  );
}
