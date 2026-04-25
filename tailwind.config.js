/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf7",
          100: "#d6f8ea",
          200: "#b0efd6",
          300: "#7ddfb7",
          400: "#3cc88d",
          500: "#11a86f",
          600: "#0d855b",
          700: "#0e6849",
          800: "#0f523b",
          900: "#0f4433"
        }
      },
      boxShadow: {
        card: "0 12px 40px rgba(15, 68, 51, 0.12)"
      }
    }
  },
  plugins: []
};