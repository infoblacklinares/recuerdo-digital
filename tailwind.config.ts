import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark:    '#0D1F0F',
        dark2:   '#142416',
        green:   '#1E3A22',
        mid:     '#2D5233',
        accent:  '#5A9E6A',
        light:   '#8FCA9A',
        gold:    '#C8A96A',
        cream:   '#F2EDE4',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
