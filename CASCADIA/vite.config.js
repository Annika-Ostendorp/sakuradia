import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      managers: path.resolve(__dirname, './src/managers'),
      enums: path.resolve(__dirname, './src/enums'),
      gameplay: path.resolve(__dirname, './src/gameplay'),
      data: path.resolve(__dirname, './src/data'),
      utils: path.resolve(__dirname, './src/utils'),
      scenes: path.resolve(__dirname, './src/scenes'),
      rendering: path.resolve(__dirname, './src/rendering'),
      objects: path.resolve(__dirname, './src/objects'),
      systems: path.resolve(__dirname, './src/systems'),
    },
  },
})
