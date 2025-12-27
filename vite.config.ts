import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// import path from 'node:path'

    // resolve: {
      // alias: {
        // '@': path.resolve(__dirname, './src'),
      // },
    // },

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const base = mode === 'development' ? '/' : '/wordmatch/'

  return {
    base,
    define: {
      __BASE_URL__: JSON.stringify(base),
    },
    plugins: [
      react(),
      tailwindcss()
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
