import { useEffect, useRef, useState } from 'react';
import { useColibriOpen } from '@hooks/useColibriOpen';

const COPIADO_MS = 2500;
const PANEL_SOLICITUD = { tipoDefault: 'solicitud', tipos: 'solicitud', emailRequired: true };

const buildEmbedSnippet = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return [
        `<script src="${base}${path}widget/v1/mapalab.js" defer></script>`,
        ``,
        `<iieg-mapalab`,
        `    api-key="mk_pub_TU_API_KEY"`,
        `    share="${id}"`,
        `    height="500">`,
        `</iieg-mapalab>`,
    ].join('\n');
};

const ShareEmbed = ({ shareId }) => {
    const [copiado, setCopiado] = useState(false);
    const [sinColibri, setSinColibri] = useState(false);
    const timerRef = useRef(null);
    const abrirColibri = useColibriOpen();

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const copiarCodigo = async () => {
        const snippet = buildEmbedSnippet(shareId);
        try {
            await navigator.clipboard.writeText(snippet);
            setCopiado(true);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopiado(false), COPIADO_MS);
        } catch {
            window.prompt('Selecciona y copia este código:', snippet);
        }
    };

    const solicitarLlave = () => {
        const abierto = abrirColibri({ motivo: 'solicitud_api_key', share_id: shareId }, PANEL_SOLICITUD);
        setSinColibri(!abierto);
    };

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[10px]/[14px] font-garet text-gray-500">
                Reemplaza <code className="px-1 bg-[#EAEFFA] text-purple rounded font-mono">mk_pub_TU_API_KEY</code> por
                la llave que te entregue el IIEG.
            </p>
            <pre className="bg-graphite text-gray-100 text-[10px]/[14px] p-3 rounded-[7px] overflow-x-auto whitespace-pre font-mono">{buildEmbedSnippet(shareId)}</pre>
            <button
                type="button"
                onClick={copiarCodigo}
                className="w-full h-9 bg-purple-deep text-white rounded-[30px] hover:bg-purple transition font-garet font-bold text-[12px] cursor-pointer"
            >
                {copiado ? '¡Código copiado!' : 'Copiar código'}
            </button>
            <button
                type="button"
                onClick={solicitarLlave}
                className="w-full h-9 rounded-[30px] border border-purple-deep text-purple-deep hover:bg-purple-soft transition font-garet font-bold text-[12px] cursor-pointer"
            >
                ¿No tienes llave? Solicítala
            </button>
            {sinColibri && (
                <p role="alert" className="text-[10px]/[14px] font-garet text-red-600 text-center">
                    El formulario de solicitudes no cargó. Intenta de nuevo en unos segundos.
                </p>
            )}
        </div>
    );
};

export default ShareEmbed;
