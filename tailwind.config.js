/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.03em" }],
      sm: ["0.875rem", { lineHeight: "1.125rem", letterSpacing: "0.01em" }],
      base: ["0.875rem", { lineHeight: "1.5715" }],
      md: ["1rem", { lineHeight: "1.5" }],
      lg: ["1rem", { lineHeight: "1.25rem" }],
      xl: ["1.125rem", { lineHeight: "1.375rem" }],
      "2xl": ["1.25rem", { lineHeight: "1.5rem" }],
      "3xl": ["1.5rem", { lineHeight: "normal", letterSpacing: "0.015em" }],
      "4xl": ["1.75rem", { lineHeight: "2.1875rem", letterSpacing: "0.01em" }],
      "5xl": ["2rem", { lineHeight: "1.15" }],
    },
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        primary: "#453956",
        secondary: "#06B6D4",

        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",

        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceMuted: "#F1F5F9",

        border: "#E2E8F0",

        textPrimary: "#0F172A",
        textSecondary: "#475569",
        textMuted: "#94A3B8",
      },
    },
  },
  plugins: [],
};
