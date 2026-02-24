import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const { resolve } = path;
    const env = loadEnv(mode, process.cwd());
    const PORT = Number(env.VITE_PORT ?? '5173');
    const HOST_FRONTEND = env.VITE_HOST_FRONTEND ?? '0.0.0.0';

    const BASE_PATH = env.VITE_BASE_PATH ?? '/';

    return {
        base: BASE_PATH,
        plugins: [react(), tailwindcss()],
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router'],
                        'vendor-ol': ['ol'],
                        'vendor-export': ['html2canvas', 'jspdf', 'jszip'],
                        'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/modifiers', '@dnd-kit/sortable', '@dnd-kit/utilities'],
                    }
                }
            }
        },
        server: {
            host: HOST_FRONTEND,
            port: PORT,
        },
        resolve: {
            alias: {
                '@components': resolve(__dirname, './src/components'),
                '@mapsComponents': resolve(__dirname, './src/pages/maps/components'),
                '@layouts': resolve(__dirname, './src/layouts'),
                '@pages': resolve(__dirname, './src/pages'),
                '@contexts': resolve(__dirname, './src/contexts'),
                '@providers': resolve(__dirname, './src/providers'),
                '@hooks': resolve(__dirname, './src/hooks'),
                '@hooksMaps': resolve(__dirname, './src/pages/maps/hooks'),
                '@icons': resolve(__dirname, './src/assets/icons'),
                '@logos': resolve(__dirname, './src/assets/logos'),
                '@png': resolve(__dirname, './src/assets/png'),
                '@helpers': resolve(__dirname, './src/helpers'),
                '@services': resolve(__dirname, './src/services'),
                '@constants': resolve(__dirname, './src/constants'),
                '@assets': resolve(__dirname, './src/assets'),
            },
        },
    }
})