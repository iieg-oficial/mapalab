import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4';
import './index.css'
import 'ol/ol.css';
import Maps from '@pages/maps/Maps';
import Home from '@pages/home/Home';
import NotFound from '@pages/NotFound';
import ErrorPage from '@pages/ErrorPage';
import MainProvider from '@providers/MainProvider';
import.meta.env;

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
            { path: 'mapa', element: <Maps /> },
            { path: '*', element: <NotFound /> },
        ],
    },
]);

createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)
