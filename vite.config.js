import { defineConfig } from 'vite'
import { resolve } from 'path'
import { apiLocal } from './dev/api-local.mjs'

export default defineConfig({
  plugins: [apiLocal()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // la web de las sorpresas y la página suelta del juego
        main: resolve(__dirname, 'index.html'),
        juego: resolve(__dirname, 'juego.html'),
        entrenar: resolve(__dirname, 'entrenar.html'),
        // el producto: la página de venta, el regalo que recibe ella y lo legal
        demo: resolve(__dirname, 'demo.html'),
        regalo: resolve(__dirname, 'regalo.html'),
        legal: resolve(__dirname, 'legal.html')
      }
    }
  }
})
