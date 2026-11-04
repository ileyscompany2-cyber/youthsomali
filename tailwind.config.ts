import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /* Primary brand */
        forest: {
          DEFAULT: "#123D35",
          light: "#16765A",
          dark: "#0D2E27",
        },
        emerald: {
          ypp: "#16765A",
        },
        gold: {
          DEFAULT: "#D9A441",
          bg: "#FBF4E5",
          dark: "#B8862E",
        },
        /* Backgrounds */
        surface: {
          DEFAULT: "#F5F7F5",
          dark: "#101A16",
          card: "#FFFFFF",
          "card-dark": "#1A2820",
          muted: "#E8F2EC",
          "muted-dark": "#162218",
        },
        /* Text */
        ink: {
          DEFAULT: "#17211D",
          muted: "#718078",
          light: "#FFFFFF",
        },
        /* Borders */
        border: {
          DEFAULT: "#E1E8E2",
          dark: "#243B2F",
        },
        /* Semantic */
        success: "#198754",
        warning: "#E5A000",
        danger: "#DC3545",
        info: "#2685C5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "sans-serif"],
        heading: ["Inter", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 2px 16px rgba(18, 61, 53, 0.08)",
        "card-hover": "0 8px 32px rgba(18, 61, 53, 0.16)",
        modal: "0 20px 60px rgba(0, 0, 0, 0.20)",
        "sidebar-item": "inset 3px 0 0 #D9A441",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInLeft: {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
