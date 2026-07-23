import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Marca Amyris (cliente) — roxo profundo da logo.
        amyris: {
          DEFAULT: "#4B0085",
          ink: "#1A0B2E",
          violet: "#7C3AED",
          lilac: "#A78BFA",
          mist: "#F4F0FB",
          glow: "#C4B5FD",
        },
        // Marca In-Haus (agência) — teal institucional.
        inhaus: {
          DEFAULT: "#027193",
          deep: "#015066",
          tint: "#E6F3F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 24px 70px -28px rgba(75, 0, 133, 0.28)",
        glow: "0 0 0 1px rgba(124, 58, 237, 0.12), 0 18px 50px -18px rgba(75, 0, 133, 0.45)",
        card: "0 1px 2px rgba(26, 11, 46, 0.04), 0 12px 32px -16px rgba(75, 0, 133, 0.18)",
      },
      backgroundImage: {
        "amyris-radial":
          "radial-gradient(120% 120% at 0% 0%, #F4F0FB 0%, #FFFFFF 38%, #FBF8FF 100%)",
        "amyris-grad": "linear-gradient(135deg, #4B0085 0%, #7C3AED 55%, #A78BFA 100%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

export default config
