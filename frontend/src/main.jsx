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

window.dataLayer = window.dataLayer || [];

const gtmId = import.meta.env.VITE_GTM_ID;
if (gtmId) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.prepend(noscript);
}

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
