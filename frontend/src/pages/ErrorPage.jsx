import { useRouteError, Link } from 'react-router';
import imgLupa from '@assets/images/img_lupa.svg';

const ErrorPage = () => {
    const error = useRouteError();

    console.error('Error capturado por React Router:', error);

    const is404 = error?.status === 404;

    const title = is404
        ? 'No encontramos la página\nque estás buscando...'
        : 'Algo salió mal...';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F0FA 100%)' }}>
            <img src={imgLupa} alt="Error" className="w-64 md:w-80 mb-8" />
            <h1 className="font-garet font-bold text-[28px]/[40px] md:text-[40px]/[56px] text-[#2E4372] tracking-[0px] mb-4 whitespace-pre-line">
                {title}
            </h1>
            {!is404 && error && (
                <p className="text-[#2E4372]/60 text-sm mb-6 max-w-md">
                    {error.statusText || error.message || 'Ha ocurrido un error inesperado.'}
                </p>
            )}
            <div className="flex gap-4 mt-4">
                <Link
                    to="/"
                    className="px-10 py-3 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px]"
                >
                    Regresar al inicio
                </Link>
                {!is404 && (
                    <button
                        onClick={() => window.location.reload()}
                        className="px-10 py-3 border border-[#703089] text-[#703089] rounded-[30px] hover:bg-[#703089] hover:text-white transition font-garet font-bold text-[14px]"
                    >
                        Recargar página
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorPage;
