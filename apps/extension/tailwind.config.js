/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: "#0a0a0b", card: "#161618", border: "#27272a", elevated: "#111113" },
        accent: { DEFAULT: "#6366f1", hover: "#818cf8" },
        muted: { DEFAULT: "#71717a", foreground: "#a1a1aa" },
      },
    },
  },
  plugins: [],
};
