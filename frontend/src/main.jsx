/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react';
import './index.css'
import NotFound from '@pages/NotFound';
import ErrorPage from '@pages/ErrorPage';
import MainProvider from '@providers/MainProvider';
import MapsProvider from '@providers/MapsProvider';
import { LayersProvider } from '@providers/LayersProvider';
import { LayerLoadingProvider } from '@contexts/LayerLoadingContext';
import Loading from '@components/Loading';
import { startMapalabCacheVersionWatcher } from '@services/eventosService';
import.meta.env;

const isEmbedRoute = typeof window !== 'undefined' && window.location.pathname.endsWith('/embed');
if (!isEmbedRoute) {
    startMapalabCacheVersionWatcher();
}

const Home = lazy(() => import('@pages/home/Home'));
const Maps = lazy(() => import('@pages/maps/Maps'));
const EmbedRoot = lazy(() => import('@pages/embed/EmbedRoot'));

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_NODE_ENV || 'production',
        release: `mapalab@${__APP_VERSION__}`,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: isDev ? 1.0 : 0.1,
        denyUrls: [/youtubei\/v1/, /google-analytics/, /googletagmanager/, /doubleclick\.net/],
    });
}

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const router = createBrowserRouter([
    {
        element: <MainProvider />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: 'mapa', element: <LayersProvider><LayerLoadingProvider><MapsProvider><Maps /></MapsProvider></LayerLoadingProvider></LayersProvider> },
            { path: 'embed', element: <EmbedRoot /> },
            { path: '*', element: <NotFound /> },
        ],
    },
], { basename: import.meta.env.VITE_BASE_PATH || '/' });

createRoot(document.getElementById('root')).render(
    <Sentry.ErrorBoundary fallback={<ErrorPage />}>
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loading visible /></div>}>
            <RouterProvider router={router} />
        </Suspense>
    </Sentry.ErrorBoundary>
)
