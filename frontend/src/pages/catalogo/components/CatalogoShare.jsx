import { useEffect, useRef, useState } from 'react';
import BrandedQr from '@components/BrandedQr';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { descargarQr } from '@utils/brandedQr';
import { REDES_COMPARTIR, TEXTO_COMPARTIR } from '@pages/maps/helpers/shareNetworks';

const QR_SIZE = 200;
const COPY_FEEDBACK_MS = 2500;
const CLASE_RED = 'block size-9 rounded-full transition-transform hover:-translate-y-0.5 cursor-pointer';
const QR_OCULTO = 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';
const QR_BOTON_OCULTO = 'pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto';

const IconoRed = ({ red }) => (
    <img
        src={red.icono}
        alt=""
        className="size-9"
        onError={(evento) => {
            if (red.respaldo && evento.currentTarget.src !== red.respaldo) evento.currentTarget.src = red.respaldo;
        }}
    />
);

const CatalogoShare = ({ url, filename, onShare }) => {
    const [copied, setCopied] = useState(false);
    const [accionesQr, setAccionesQr] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [qrError, setQrError] = useState(false);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        setCopied(false);
        setAccionesQr(false);
        setQrError(false);
    }, [url]);

    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

    const handleCopy = async () => {
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

    const handleDownloadQr = async () => {
        if (descargando) return;
        onShare?.('qr_download');
        setDescargando(true);
        try {
            await descargarQr(url, filename);
        } catch {
            setQrError(true);
        } finally {
            setDescargando(false);
        }
    };

    return (
        <div className="mt-2 flex flex-col gap-3">
            <div className="relative">
                <input
                    type="text"
                    value={url}
                    readOnly
                    aria-label="Enlace de la capa"
                    onFocus={(evento) => requestAnimationFrame(() => evento.target.select())}
                    className="w-full py-3 pl-3 pr-13 border-none bg-[#EAEFFA] rounded-lg text-[12px]/[18px] text-[#191919] font-garet truncate focus:outline-purple"
                />
                <Tooltip content={copied ? '¡Enlace copiado!' : 'Copiar enlace'} placement="top" delay={300} triggerClassName="absolute right-0 top-0 h-full">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`h-full w-11 rounded-r-lg flex items-center justify-center transition-colors cursor-pointer ${copied ? 'bg-[#16A34A]' : 'bg-purple-deep hover:bg-purple'}`}
                        aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                    >
                        <Icon name={copied ? 'shared_click' : 'copie'} state="hover" className="size-5" />
                    </button>
                </Tooltip>
            </div>

            <div className="flex justify-center">
                <div className="group relative">
                    <BrandedQr url={url} size={QR_SIZE} />
                    <button
                        type="button"
                        onClick={() => setAccionesQr((visible) => !visible)}
                        aria-expanded={accionesQr}
                        aria-label="Mostrar opciones del código QR"
                        className="absolute inset-0 rounded-[10px] cursor-pointer"
                    />
                    <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 px-4 text-center bg-white/90 rounded-[10px] transition-opacity duration-150 ${accionesQr ? 'opacity-100' : QR_OCULTO}`}>
                        <span className="text-[12px]/[16px] font-garet text-graphite">
                            {qrError ? 'No se pudo descargar el código QR.' : 'Escanéalo o úsalo en una presentación'}
                        </span>
                        <button
                            type="button"
                            onClick={handleDownloadQr}
                            disabled={descargando}
                            className={`h-9 px-5 rounded-[30px] bg-orange text-white hover:bg-[#E07400] font-garet font-bold text-[12px] cursor-pointer disabled:opacity-60 ${accionesQr ? 'pointer-events-auto' : QR_BOTON_OCULTO}`}
                        >
                            {descargando ? 'Descargando…' : 'Descargar PNG'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-3">
                {REDES_COMPARTIR.map((red) => (
                    <Tooltip key={red.id} content={red.etiqueta} placement="top" delay={300}>
                        <a
                            href={red.construir(url, TEXTO_COMPARTIR)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onShare?.(`red_${red.id}`)}
                            aria-label={`Compartir en ${red.etiqueta}`}
                            className={CLASE_RED}
                        >
                            <IconoRed red={red} />
                        </a>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};

export default CatalogoShare;
