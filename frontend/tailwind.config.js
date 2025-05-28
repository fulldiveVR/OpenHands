/** @type {import('tailwindcss').Config} */
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#709eff", // nice yellow
        logo: "#709eff", // color for logos and icons
        base: "#19181c", // dark background also used for tooltips
        "base-secondary": "#201f22", // lighter background
        danger: "#ff658d",
        success: "#82eacf",
        basic: "#78748b", // light gray
        tertiary: "#312e41", // gray, used for inputs
        "tertiary-light": "#78748b", // lighter gray, used for borders and placeholder text
        content: "#fdf8fd", // light gray, used mostly for text
        "content-2": "#cbc6cb",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "dark",
      layout: {
        radius: {
          small: "5px",
          large: "20px",
        },
      },
      themes: {
        dark: {
          colors: {
            primary: "#709eff",
            logo: "#709eff",
          },
        },
      },
    }),
    typography,
  ],
};
