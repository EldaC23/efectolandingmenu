/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/*.js"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0908",
        coal: "#151210",
        char: "#1d1916",
        gold: { DEFAULT: "#cfa832", soft: "#e8c968", deep: "#9a7a1c" },
        ember: { DEFAULT: "#e02424", dark: "#b81818" },
        cream: { DEFAULT: "#f5eddd", paper: "#fbf6ea", edge: "#e6d9bd" },
        maroon: { DEFAULT: "#7b1a16", dark: "#4a0f0c" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
