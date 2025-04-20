/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts}", "./popup.html"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
