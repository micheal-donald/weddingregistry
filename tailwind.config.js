/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#66507A',     // Deep Purple
        secondary: '#AC9BC0',   // Soft Lilac
        accent: '#B48A3A',      // Gold
        sage: '#8BA495',        // Sage Green
        background: '#F5EFE1',  // Pale Cream
        dark: '#3A2A47',        // Deep Plum
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
