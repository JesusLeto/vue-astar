import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        'table':               '#aed6dc',
        'cell-barrier':        '#00154f',
        'cell-route':          '#FDFE6A',
        'cell-expansion-0':    '#414974',
        'cell-expansion-60':   '#4884d6',
        'cell-expansion-80':   '#42ddcb',
        'cell-expansion-100':  '#41c9e0',
      },
      gridTemplateColumns: {
        board: 'repeat(50, 32px)',
      },
      gridTemplateRows: {
        board: 'repeat(28, 32px)',
      },
    },
  },
  safelist: ['barrier', 'expansion', 'route', 'with-animation'],
  plugins: [],
} satisfies Config
