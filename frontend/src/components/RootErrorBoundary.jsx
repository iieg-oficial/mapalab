import { Component } from 'react';
import ErrorScreen from '@components/ErrorScreen';
import { reportClientError } from '@services/clientErrorService';

class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('[mapalab] error no capturado', error, info?.componentStack);
        reportClientError({
            type: 'render_error',
            message: error?.message || String(error),
            url: info?.componentStack?.trim().split('\n')[0] || '',
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorScreen
                    title={'Algo salió mal...'}
                    description={'Ocurrió un error inesperado al cargar la aplicación.\nIntenta recargar la página.'}
                />
            );
        }
        return this.props.children;
    }
}

export default RootErrorBoundary;
