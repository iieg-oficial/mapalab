import imgLupa from '@assets/images/img_lupa.svg';

const HOME_HREF = import.meta.env.VITE_BASE_PATH || '/';

const ErrorScreen = ({ title, description, showReload = true, onRetry }) => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F0FA 100%)' }}>
        <img src={imgLupa} alt="Error" className="w-64 md:w-80 mb-8" />
        <h1 className="font-garet font-bold text-[28px]/[40px] md:text-[40px]/[56px] text-[#2E4372] tracking-[0px] mb-4 whitespace-pre-line">
            {title}
        </h1>
        {description && (
            <p className="font-garet text-[16px]/[24px] md:text-[18px]/[28px] text-[#2E4372] max-w-xl mb-4 whitespace-pre-line">
                {description}
            </p>
        )}
        <div className="flex flex-col w-full md:w-auto md:flex-row gap-4 mt-4">
            <a
                href={HOME_HREF}
                className="px-10 py-3 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px]"
            >
                Regresar al inicio
            </a>
            {showReload && (
                <button
                    onClick={onRetry ?? (() => window.location.reload())}
                    className="px-10 py-3 border border-[#703089] text-[#703089] rounded-[30px] hover:bg-[#703089] hover:text-white transition font-garet font-bold text-[14px]"
                >
                    {onRetry ? 'Intentar de nuevo' : 'Recargar página'}
                </button>
            )}
        </div>
    </div>
);

export default ErrorScreen;
