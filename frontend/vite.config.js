import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync, statSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

function countLinesInDir(dir, extensions, excludeDirs) {
    let total = 0;
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return 0;
    }
    for (const name of entries) {
        if (excludeDirs.includes(name)) continue;
        const fullPath = path.join(dir, name);
        let s;
        try { s = statSync(fullPath); } catch { continue; }
        if (s.isDirectory()) {
            total += countLinesInDir(fullPath, extensions, excludeDirs);
        } else if (extensions.some(ext => name.endsWith(ext))) {
            try {
                total += readFileSync(fullPath, 'utf-8').split('\n').length;
            } catch { /* skip unreadable */ }
        }
    }
    return total;
}

function countLinesOfCode() {
    const repoRoot = path.resolve(__dirname, '..');
    const exclude = ['node_modules', '.venv', '__pycache__', '.git', 'dist', 'coverage'];
    const frontend = countLinesInDir(path.resolve(__dirname, 'src'), ['.js', '.jsx', '.css'], exclude);
    const backend = countLinesInDir(path.resolve(repoRoot, 'backend'), ['.py'], exclude);
    return frontend + backend;
}

const APP_LOC = countLinesOfCode();

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
            __APP_VERSION__: JSON.stringify(pkg.version),
            __APP_LOC__: JSON.stringify(APP_LOC)
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
        ].filter(Boolean),
        build: {
            sourcemap: false,
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 70 },
                            { name: 'vendor-router', test: /node_modules[\\/]react-router/, priority: 65 },
                            { name: 'vendor-ol', test: /node_modules[\\/]ol[\\/]/, priority: 60 },
                            { name: 'vendor-lottie', test: /node_modules[\\/](lottie-web|lottie-react)[\\/]/, priority: 55 },
                            { name: 'vendor-dnd', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 40 },
                            { name: 'vendor-download', test: /[\\/](jszip|pako|fast-png|fflate|iobuffer)[\\/]/, priority: 35 },
                            { name: 'vendor-export', test: /[\\/](jspdf|html2canvas|html2canvas-pro|dompurify|canvg|svg-pathdata|rgbcolor|stackblur-canvas|raf|performance-now|css-line-break|text-segmentation)[\\/]/, priority: 30 },
                        ],
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
                    },
                    '/api/public': {
                        target: env.MARIACHI_DEV_TARGET,
                        changeOrigin: true,
                    },
                    '/colibri': {
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