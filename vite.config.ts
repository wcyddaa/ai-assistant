import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: __dirname
      }
    ]
  }
})