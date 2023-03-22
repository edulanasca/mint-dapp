import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['esnext'],
    commonjsOptions: {
      ignoreTryCatch: id => id !== 'stream',
    },
  },
  define: {
    'process.env': process.env,
    'global': {}
  },
  resolve: {
    alias: [
      {
        find: 'stream',
        replacement: `stream-browserify`,
      },
    ],
  },
})
