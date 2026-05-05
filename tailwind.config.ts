import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0,0,0,0.08)",
        float: "0 4px 20px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)",
      },
    },
  },
  plugins: [],
} satisfies Config;
