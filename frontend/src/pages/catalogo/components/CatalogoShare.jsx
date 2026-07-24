import { useEffect, useRef, useState } from 'react';
import logoMapalabShort from '@logos/mapalab_short.svg';

const QR_SIZE = 200;
const QR_DOWNLOAD_SIZE = 800;
const COPY_FEEDBACK_MS = 2500;

const buildQrOptions = (url, size) => ({
    width: size,
    height: size,
    type: 'canvas',
    data: url,
    image: logoMapalabShort,
    margin: 4,
    qrOptions: { errorCorrectionLevel: 'H' },
    imageOptions: { margin: 4, imageSize: 0.35, hideBackgroundDots: true },
    dotsOptions: { type: 'rounded', color: '#5C2472' },
    cornersSquareOptions: { type: 'extra-rounded', color: '#703088' },
    backgroundOptions: { color: '#FFFFFF' },
});

const PILL = 'text-[12px] font-garet px-3 py-1.5 rounded-[14px] border transition-colors disabled:opacity-50';
const PILL_IDLE = 'border-orange text-orange hover:bg-orange hover:text-white';
const PILL_ACTIVE = 'border-orange bg-orange text-white';

const CatalogoShare = ({ url, filename, onShare }) => {
    const [mode, setMode] = useState(null);
    const [copied, setCopied] = useState(false);
    const [qrError, setQrError] = useState(false);
    const qrRef = useRef(null);
    const qrInstanceRef = useRef(null);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        setMode(null);
        setCopied(false);
    }, [url]);

    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

    useEffect(() => {
        if (mode !== 'qr' || !qrRef.current) return;
        let cancelled = false;
        setQrError(false);
        import('qr-code-styling')
            .then(({ default: QRCodeStyling }) => {
                if (cancelled || !qrRef.current) return;
                qrRef.current.replaceChildren();
                qrInstanceRef.current = new QRCodeStyling(buildQrOptions(url, QR_SIZE));
                qrInstanceRef.current.append(qrRef.current);
            })
            .catch(() => { if (!cancelled) setQrError(true); });
        return () => { cancelled = true; };
    }, [mode, url]);

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
        if (next === 'qr') onShare?.('qr');
    };

    const handleDownloadQr = async () => {
        onShare?.('qr_download');
        try {
            const { default: QRCodeStyling } = await import('qr-code-styling');
            const big = new QRCodeStyling(buildQrOptions(url, QR_DOWNLOAD_SIZE));
            await big.download({ name: filename, extension: 'png' });
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
                    {qrError ? (
                        <p className="text-[11px] font-garet text-graphite text-center">
                            No se pudo generar el código QR.
                        </p>
                    ) : (
                        <>
                            <div ref={qrRef} className="rounded-[10px] overflow-hidden" />
                            <button
                                type="button"
                                onClick={handleDownloadQr}
                                className="px-4 py-1.5 rounded-[30px] text-[12px] font-garet font-bold bg-orange text-white hover:bg-[#E07400] transition-colors"
                            >
                                Descargar PNG
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CatalogoShare;
