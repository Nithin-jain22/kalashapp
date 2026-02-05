/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9e9ff",
          200: "#b6d4ff",
          300: "#88b6ff",
          400: "#5a96ff",
          500: "#2f73ff",
          600: "#1f57db",
          700: "#1845b0",
          800: "#173a8a",
          900: "#152f6d"
        }
      }
    }
  },
  plugins: []
};
