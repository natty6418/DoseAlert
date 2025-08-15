/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF", // White as the primary color
        secondary: {
          DEFAULT: "#c0ee77", // Lime
          100: "#B8F64E",     // Lighter lime shade
          200: "#8eda0b",     // Darker lime shade
        },
        black: {
          DEFAULT: "#000000",  // Black for contrast
          100: "#1a1a1a",      // Slightly lighter black
          200: "#2B2B2B",      // Darker black
        },
        gray: {
          100: "#F5F5F5",      // Light gray for backgrounds
        },
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
}

