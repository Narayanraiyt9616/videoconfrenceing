import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_SERVER_URL || 'http://localhost:5000';

  return {
    root: __dirname,
    plugins: [react()],
    resolve: {
      preserveSymlinks: true
    },
    server: {
      port: 5173,
      host: true,
      fs: {
        allow: [__dirname, path.resolve(__dirname, '..')]
      },
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
