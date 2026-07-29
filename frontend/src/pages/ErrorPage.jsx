import { useRouteError } from 'react-router';
import ErrorScreen from '@components/ErrorScreen';

const ErrorPage = ({ title: titleProp, description, onRetry }) => {
    const routeError = useRouteError();

    if (routeError) {
        console.error('Error capturado por React Router:', routeError);
    }

    const is404 = !titleProp && routeError?.status === 404;

    const title = titleProp ?? (is404
        ? 'No encontramos la página\nque estás buscando...'
        : 'Algo salió mal...');

    return (
        <ErrorScreen
            title={title}
            description={description}
            showReload={!is404}
            onRetry={onRetry}
        />
    );
};

export default ErrorPage;
