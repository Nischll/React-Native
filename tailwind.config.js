/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }], // 12
      sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14
      base: ["1rem", { lineHeight: "1.5rem" }], // 16
      lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18
      xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20
      "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36
      "5xl": ["3rem", { lineHeight: "1" }], // 48
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
