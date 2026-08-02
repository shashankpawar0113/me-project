/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ethos: {
          surface: '#f9f9ff',
          'surface-dim': '#d4daea',
          'surface-container-low': '#f1f3ff',
          'surface-container': '#e8eeff',
          'on-surface': '#161c27',
          'on-surface-variant': '#414943',
          primary: '#043d27',
          'primary-container': '#22543d',
          'on-primary-container': '#93c7a9',
          secondary: '#006d40',
          'secondary-container': '#8ef5b5',
          'on-secondary-container': '#007243',
          outline: '#717973',
          'outline-variant': '#c0c9c1',
          background: '#f9f9ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'ethos-sm': '0.125rem',
        'ethos-md': '0.25rem',
        'ethos-lg': '0.5rem',
        'ethos-xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
