import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
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
    const acervoOrigin = (env.VITE_ACERVO_ORIGIN || '').trim();
    return {
        name: 'html-meta',
        transformIndexHtml(html) {
            return html
                .replace(/__SITE_URL__/g, fullUrl)
                .replace(/__ACERVO_ORIGIN__/g, acervoOrigin);
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
        plugins: [
            react(),
            tailwindcss(),
            deferCssPlugin(),
            htmlMetaPlugin(env),
            env.VITE_ANALYZE && visualizer({
                filename: 'dist/stats.html',
                template: 'treemap',
                gzipSize: true,
                brotliSize: true,
                open: false,
                emitFile: false,
            }),
            env.VITE_ANALYZE && visualizer({
                filename: 'dist/stats.json',
                template: 'raw-data',
                gzipSize: true,
                brotliSize: true,
                open: false,
                emitFile: false,
            }),
            env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
                org: env.SENTRY_ORG,
                project: env.SENTRY_PROJECT,
                url: env.SENTRY_URL,
                authToken: env.SENTRY_AUTH_TOKEN,
                release: { name: `mapalab@${pkg.version}` },
                sourcemaps: { assets: './dist/**' },
                telemetry: false,
            }),
        ].filter(Boolean),
        build: {
            sourcemap: Boolean(env.SENTRY_AUTH_TOKEN),
            rollupOptions: {
                output: {
                    manualChunks: (id) => {
                        if (id.includes('node_modules')) {
                            if (id.includes('/ol/')) return 'vendor-ol';
                            if (id.includes('lottie-web') || id.includes('lottie-react')) return 'vendor-lottie';
                            if (id.includes('react-router')) return 'vendor-router';
                            if (id.includes('react-dom') || id.includes('react') || id.includes('scheduler')) return 'vendor-react';
                            if (id.includes('@dnd-kit')) return 'vendor-dnd';
                            if (id.includes('@sentry')) return 'vendor-sentry';
                            if (/\/(jszip|pako|fast-png|fflate|iobuffer)\//.test(id)) return 'vendor-download';
                            if (/\/(jspdf|html2canvas|dompurify|canvg|svg-pathdata|rgbcolor|stackblur-canvas|raf|performance-now|css-line-break|text-segmentation)\//.test(id)) return 'vendor-export';
                        }
                    },
                },
            },
        },
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
                ...(env.MARIACHI_DEV_TARGET && {
                    '/api/mapalab': {
                        target: env.MARIACHI_DEV_TARGET,
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
                '@utils': resolve(__dirname, './src/utils'),
            },
        },
    }
})