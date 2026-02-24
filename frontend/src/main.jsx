import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4';
import './index.css'
import NotFound from '@pages/NotFound';
import ErrorPage from '@pages/ErrorPage';
import MainProvider from '@providers/MainProvider';
import MapsProvider from '@providers/MapsProvider';
import Loading from '@components/Loading';
import.meta.env;

const Home = lazy(() => import('@pages/home/Home'));
const Maps = lazy(() => import('@pages/maps/Maps'));

const MODE = import.meta.env.VITE_NODE_ENV
const isDev = MODE === 'development';
const trackingID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

isDev && console.info('¡Tú estás viendo esto, porque estás en modo de desarrollo!');

ReactGA.initialize(trackingID, {
    testMode: MODE,
    gaOptions: {
        cookieFlags: isDev ? 'SameSite=None;Secure' : 'Lax'
    }
});

const router = createBrowserRouter([
    {
        element: <MainProvider />,
        errorElement: <ErrorPage />,
        children: [
            { index: true, element: <Home /> },
            { path: 'mapa', element: <MapsProvider><Maps /></MapsProvider> },
            { path: '*', element: <NotFound /> },
        ],
    },
], { basename: import.meta.env.VITE_BASE_PATH || '/' });

createRoot(document.getElementById('root')).render(
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loading visible /></div>}>
        <RouterProvider router={router} />
    </Suspense>
)
