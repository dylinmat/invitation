import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom Enterprise Colors
        cream: {
          50: '#FDFCF8',
          100: '#FAF9F4',
          200: '#F5F3EA',
          300: '#EDE9DC',
          400: '#E2DCC8',
          500: '#D4CCB0',
          600: '#B8AD8A',
          700: '#9C9168',
          800: '#7A7152',
          900: '#5A543D',
        },
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6D6D6D',
          600: '#5D5D5D',
          700: '#4F4F4F',
          800: '#454545',
          900: '#2A2A2A',
        },
        rose: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F8D0D9',
          300: '#F2AAB9',
          400: '#E97891',
          500: '#D94666',
          600: '#C4355A',
          700: '#A6284A',
          800: '#8B2543',
          900: '#77233D',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E3EBE3',
          200: '#C5D8C5',
          300: '#9BB89B',
          400: '#729672',
          500: '#527A52',
          600: '#3D5F3D',
          700: '#324C32',
          800: '#2A3D2A',
          900: '#233323',
        },
        coral: {
          50: '#FDF4F3',
          100: '#FBE8E5',
          200: '#F7D5CF',
          300: '#F0B8AE',
          400: '#E58F80',
          500: '#D65F4F',
          600: '#C44A3B',
          700: '#A43B30',
          800: '#88332D',
          900: '#722E2A',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(10px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.2s ease-out",
        "slide-out-left": "slide-out-left 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      spacing: {
        // Safe area insets for notched devices
        "safe-area-inset-top": "env(safe-area-inset-top)",
        "safe-area-inset-bottom": "env(safe-area-inset-bottom)",
        "safe-area-inset-left": "env(safe-area-inset-left)",
        "safe-area-inset-right": "env(safe-area-inset-right)",
        // Minimum touch target sizes
        "touch-target": "44px",
        "touch-target-sm": "32px",
      },
      minHeight: {
        "touch-target": "44px",
        "touch-target-sm": "32px",
      },
      minWidth: {
        "touch-target": "44px",
        "touch-target-sm": "32px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom plugin for touch targets
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tap-highlight-transparent': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
      });
    },
  ],
};

export default config;
