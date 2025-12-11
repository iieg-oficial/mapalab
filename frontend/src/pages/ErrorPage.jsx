import { useRouteError, Link } from 'react-router';

const ErrorPage = () => {
    const error = useRouteError();

    console.error('Error capturado por React Router:', error);

    const getErrorMessage = () => {
        if (error?.status === 404) {
            return {
                title: '404 - Página no encontrada',
                message: 'La página que buscas no existe.',
            };
        }

        if (error?.message) {
            return {
                title: 'Error en la aplicación',
                message: error.message,
            };
        }

        return {
            title: 'Algo salió mal',
            message: 'Ha ocurrido un error inesperado.',
        };
    };

    const { title, message } = getErrorMessage();

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-24 w-24 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    {title}
                </h1>

                <p className="text-lg text-gray-600 mb-6">
                    {message}
                </p>

                {error && (
                    <div className="mb-6 text-left">
                        <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                                Detalles técnicos del error
                            </summary>
                            <div className="mt-4 space-y-2">
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-sm font-mono text-red-800 break-words">
                                        {error.statusText || error.message || 'Error desconocido'}
                                    </p>
                                </div>
                                {error.stack && (
                                    <div className="bg-gray-100 border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                                        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                                            {error.stack}
                                        </pre>
                                    </div>
                                )}
                                {error.data && (
                                    <div className="bg-gray-100 border border-gray-300 rounded p-3">
                                        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                                            {JSON.stringify(error.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleReload}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                    >
                        Recargar página
                    </button>

                    <Link
                        to="/"
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold inline-block"
                    >
                        Volver al inicio
                    </Link>
                </div>

                <div className="mt-8 text-sm text-gray-500">
                    <p>Si el problema persiste, por favor contacta al soporte técnico.</p>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
