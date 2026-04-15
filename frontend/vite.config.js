import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

function htmlMetaPlugin(env) {
    const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');
    const basePath = (env.VITE_BASE_PATH || '/').replace(/\/$/, '');
    const fullUrl = basePath !== '/' ? `${siteUrl}${basePath}` : siteUrl;
    return {
        name: 'html-meta',
        transformIndexHtml(html) {
            return html.replace(/__SITE_URL__/g, fullUrl);
        }
    };
}

function deferCssPlugin() {
    return {
        name: 'defer-css',
        transformIndexHtml(html) {
            return html.replace(
                /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
                `<link rel="preload" as="style" href="$1" onload="this.rel='stylesheet'"><noscript><link rel="stylesheet" href="$1"></noscript>`
            );
        }
    };
}

export default defineConfig(({ mode }) => {
    const { resolve } = path;
    const env = loadEnv(mode, process.cwd(), '');
    const PORT = Number(env.VITE_PORT ?? '5173');
    const HOST_FRONTEND = env.VITE_HOST_FRONTEND ?? '0.0.0.0';

    const BASE_PATH = env.VITE_BASE_PATH ?? '/';

    return {
        base: BASE_PATH,
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version)
        },
        plugins: [react(), tailwindcss(), deferCssPlugin(), htmlMetaPlugin(env)],
        build: {},
        server: {
            host: HOST_FRONTEND,
            port: PORT,
            proxy: {
                ...(env.GEOSERVER_DEV_TARGET && {
                    '/geoserver': {
                        target: env.GEOSERVER_DEV_TARGET,
                        changeOrigin: true,
                    }
                }),
                ...(env.BACKEND_DEV_TARGET && {
                    '/api': {
                        target: env.BACKEND_DEV_TARGET,
                        changeOrigin: true,
                        rewrite: (path) => path.replace(/^\/api/, ''),
                    }
                }),
            },
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