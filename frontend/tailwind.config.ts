// frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-forest': '#0C1208',
        'forest-green': '#3A6432',
        'canopy': '#4A7C40',
        'sage': '#8FB87A',
        'antique-gold': '#C8A84A',
        'parchment': '#F5F2EC',
        'linen': '#E8DFC8',
      },
    },
  },
  plugins: [],
};
export default config;