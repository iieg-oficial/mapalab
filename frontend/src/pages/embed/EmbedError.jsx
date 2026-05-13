const buildFullViewerUrl = () => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    const qs = window.location.search.replace(/^\?/, '');
    const params = new URLSearchParams(qs);
    params.delete('key');
    const tail = params.toString();
    return tail ? `${base}${path}mapa?${tail}` : `${base}${path}mapa`;
};


const EmbedError = ({ title = 'No se pudo cargar el mapa', message }) => {
    const fullUrl = buildFullViewerUrl();
    const reload = () => {
        if (typeof window !== 'undefined') window.location.reload();
    };
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="max-w-md text-center px-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
                {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}
                <div className="flex gap-2 justify-center flex-wrap">
                    <button
                        type="button"
                        onClick={reload}
                        className="px-3 py-2 text-sm rounded bg-[#703088] text-white hover:bg-[#5d2670]"
                    >
                        Reintentar
                    </button>
                    <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm rounded border border-[#703088] text-[#703088] hover:bg-[#F7F0FA]"
                    >
                        Abrir el visor completo
                    </a>
                </div>
                <p className="text-[11px] text-gray-400 mt-4">
                    Fuente: IIEG · Si el problema continúa, comunícate con el área de mapas de tu institución.
                </p>
            </div>
        </div>
    );
};

export default EmbedError;
