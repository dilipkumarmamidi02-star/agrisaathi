/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#16a34a",
        secondary: "#15803d",
        // AgriSaathi Intelligence OS palette
        ink: "#0a0e0a",           // near-black background
        surface: "#12160f",       // elevated surface
        "surface-hover": "#1a1f16",
        border: "#232a1e",
        "border-strong": "#374332",
        accent: "#d4ff3f",        // neon yellow-green
        "accent-soft": "#d4ff3f1a",
        mint: "#4ade80",          // secondary accent (sign-in green)
        "text-primary": "#f5f5f0",
        "text-secondary": "#a8b0a0",
        "text-muted": "#6b7264",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
