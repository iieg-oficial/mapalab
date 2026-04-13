/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client'
import './index.css'
import NotFound from '@pages/NotFound';
import ErrorPage from '@pages/ErrorPage';
import MainProvider from '@providers/MainProvider';
import MapsProvider from '@providers/MapsProvider';
import { LayerLoadingProvider } from '@contexts/LayerLoadingContext';
import Loading from '@components/Loading';
import.meta.env;

const Home = lazy(() => import('@pages/home/Home'));
const Maps = lazy(() => import('@pages/maps/Maps'));

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

const router = createBrowserRouter([
    {
        element: <MainProvider />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: 'mapa', element: <LayerLoadingProvider><MapsProvider><Maps /></MapsProvider></LayerLoadingProvider> },
            { path: '*', element: <NotFound /> },
        ],
    },
], { basename: import.meta.env.VITE_BASE_PATH || '/' });

createRoot(document.getElementById('root')).render(
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loading visible /></div>}>
        <RouterProvider router={router} />
    </Suspense>
)
