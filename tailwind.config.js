/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f7f8fb",
        line: "#d9deea",
        brand: "#4f46e5",
        accent: "#0891b2"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};
