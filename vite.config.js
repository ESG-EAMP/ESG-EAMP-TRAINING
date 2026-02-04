import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import os from 'os'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  server: {
    host: '0.0.0.0',
    port: process.env.VITE_PORT,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'unguentary-ean-intergonial.ngrok-free.dev',
      'unguentary-ean-intergonial.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io'
    ],
    cors: {
      origin: true,
      credentials: true
    }
  }
})
