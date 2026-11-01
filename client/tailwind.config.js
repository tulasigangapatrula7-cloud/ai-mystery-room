/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070d",
        navy: { 900: "#0a1020", 800: "#0f182e", 700: "#16213f" },
        charcoal: "#1a1d26",
        gold: { 300: "#f0d78c", 400: "#e2bf5f", 500: "#c9a227", 600: "#a8841a" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(226, 191, 95, 0.25)",
      },
    },
  },
  plugins: [],
};
