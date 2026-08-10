import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          DEFAULT: "#F4A9C6",
          light: "#FBDCE8",
          dark: "#E8789F",
        },
        lavender: {
          DEFAULT: "#C9AEF0",
          light: "#E4D4FA",
          dark: "#A981E0",
        },
        cream: {
          DEFAULT: "#FFF4E0",
          light: "#FFFBF3",
          dark: "#F9E3B8",
        },
        babyblue: {
          DEFAULT: "#A8D8F0",
          light: "#D3ECFA",
          dark: "#7CC0E8",
        },
        // Primary/CTA color — a pastel orchid pink-purple.
        pastel: {
          DEFAULT: "#D888BB",
          light: "#EDBEDD",
          dark: "#B968A0",
        },
        gold: {
          DEFAULT: "#E8B84B",
          light: "#F2CD79",
          dark: "#C99A2E",
        },
        ink: {
          DEFAULT: "#5B4B4F",
          light: "#8A7377",
          dark: "#3A2E31",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(91, 75, 79, 0.18)",
        softlg: "0 16px 40px -12px rgba(91, 75, 79, 0.22)",
        glow: "0 10px 28px -8px rgba(219, 157, 196, 0.45)",
      },
      backgroundImage: {
        "pastel-hero":
          "radial-gradient(circle at 15% 20%, #FBDCE8 0%, transparent 48%), radial-gradient(circle at 85% 15%, #D3ECFA 0%, transparent 48%), radial-gradient(circle at 50% 90%, #E4D4FA 0%, transparent 58%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(6deg)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(-8deg) scale(1.05)" },
          "75%": { transform: "rotate(8deg) scale(1.05)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "bounce-in": "bounce-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
