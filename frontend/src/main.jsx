/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client'
import './index.css'
import NotFound from '@pages/NotFound';
import ErrorPage from '@pages/ErrorPage';
import MainProvider from '@providers/MainProvider';
import MapsProvider from '@providers/MapsProvider';
import { LayersProvider } from '@providers/LayersProvider';
import { SesionProvider } from '@providers/SesionProvider';
import { LayerLoadingProvider } from '@contexts/LayerLoadingContext';
import Loading from '@components/Loading';
import RootErrorBoundary from '@components/RootErrorBoundary';
import { startMapalabCacheVersionWatcher } from '@services/eventosService';
import { useIsNonProd } from '@hooks/useDevTools';

const isEmbedRoute = typeof window !== 'undefined' && window.location.pathname.endsWith('/embed');
if (!isEmbedRoute) {
    startMapalabCacheVersionWatcher();
}

const Home = lazy(() => import('@pages/home/Home'));
const Maps = lazy(() => import('@pages/maps/Maps'));
const EmbedRoot = lazy(() => import('@pages/embed/EmbedRoot'));
const CatalogoPage = lazy(() => import('@pages/catalogo/CatalogoPage'));

const CatalogoRuta = () => (useIsNonProd() ? <CatalogoPage /> : <Navigate to="/mapa" replace />);

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const router = createBrowserRouter([
    {
        element: <MainProvider />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: 'mapa', element: <SesionProvider><LayersProvider><LayerLoadingProvider><MapsProvider><Maps /></MapsProvider></LayerLoadingProvider></LayersProvider></SesionProvider> },
            { path: 'embed', element: <EmbedRoot /> },
            { path: 'catalogo', element: <CatalogoRuta /> },
            { path: 'catalogo/:seg1', element: <CatalogoRuta /> },
            { path: 'catalogo/:seg1/:seg2', element: <CatalogoRuta /> },
            { path: '*', element: <NotFound /> },
        ],
    },
], { basename: import.meta.env.VITE_BASE_PATH || '/' });

createRoot(document.getElementById('root')).render(
    <RootErrorBoundary>
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loading visible /></div>}>
            <RouterProvider router={router} />
        </Suspense>
    </RootErrorBoundary>
)
