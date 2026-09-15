import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // la web de las sorpresas y la página suelta del juego
        main: resolve(__dirname, 'index.html'),
        juego: resolve(__dirname, 'juego.html'),
        entrenar: resolve(__dirname, 'entrenar.html'),
        demo: resolve(__dirname, 'demo.html')
      }
    }
  }
})
