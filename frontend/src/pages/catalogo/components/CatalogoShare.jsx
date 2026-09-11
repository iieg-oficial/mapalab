import { useEffect, useRef, useState } from 'react';
import BrandedQr from '@components/BrandedQr';
import { descargarQr } from '@utils/brandedQr';

const QR_SIZE = 200;
const COPY_FEEDBACK_MS = 2500;

const PILL = 'text-[12px] font-garet px-3 py-1.5 rounded-[14px] border transition-colors disabled:opacity-50';
const PILL_IDLE = 'border-orange text-orange hover:bg-orange hover:text-white';
const PILL_ACTIVE = 'border-orange bg-orange text-white';

const CatalogoShare = ({ url, filename, onShare }) => {
    const [mode, setMode] = useState(null);
    const [copied, setCopied] = useState(false);
    const [qrError, setQrError] = useState(false);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        setMode(null);
        setCopied(false);
    }, [url]);

    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

    const handleCopy = async () => {
        setMode('link');
        onShare?.('link');
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch {
            window.prompt('Selecciona y copia este enlace:', url);
        }
    };

    const handleQr = () => {
        const next = mode === 'qr' ? null : 'qr';
        setMode(next);
        setQrError(false);
        if (next === 'qr') onShare?.('qr');
    };

    const handleDownloadQr = async () => {
        onShare?.('qr_download');
        try {
            await descargarQr(url, filename);
        } catch {
            setQrError(true);
        }
    };

    return (
        <div className="mt-2">
            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`${PILL} ${copied
                        ? 'border-[#22C55E] bg-[#DCFCE7] text-[#16A34A]'
                        : PILL_IDLE}`}
                >
                    {copied ? '¡Copiado!' : 'Enlace'}
                </button>
                <button
                    type="button"
                    onClick={handleQr}
                    aria-pressed={mode === 'qr'}
                    className={`${PILL} ${mode === 'qr' ? PILL_ACTIVE : PILL_IDLE}`}
                >
                    QR
                </button>
            </div>

            {mode === 'qr' && (
                <div className="mt-2 flex flex-col items-center gap-2">
                    <BrandedQr url={url} size={QR_SIZE} />
                    {qrError ? (
                        <p className="text-[11px] font-garet text-graphite text-center">
                            No se pudo descargar el código QR.
                        </p>
                    ) : (
                        <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="px-4 py-1.5 rounded-[30px] text-[12px] font-garet font-bold bg-orange text-white hover:bg-[#E07400] transition-colors"
                        >
                            Descargar PNG
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CatalogoShare;
