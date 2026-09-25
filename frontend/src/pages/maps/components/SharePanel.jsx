import { useEffect, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Checkbox from '@components/Checkbox';
import Badge from '@components/Badge';
import BrandedQr from '@components/BrandedQr';
import Logo from '@components/Logo';
import PanelHoja from '@components/PanelHoja';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { pinShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { descargarQr } from '@utils/brandedQr';
import { REDES_COMPARTIR, TEXTO_COMPARTIR } from '@pages/maps/helpers/shareNetworks';
import ShareEmbed from './ShareEmbed';

const QR_PANEL = 200;
const CARGA_DIFERIDA_MS = 300;
const CLASE_RED = 'block size-9 rounded-full transition-transform hover:-translate-y-0.5 cursor-pointer';
const RETENCION = 'El enlace se borra si nadie lo usa durante 30 días. Fíjalo para conservarlo un año.';
const RETENCION_FIJADO = 'Este enlace ya no se elimina de forma automática.';
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

const SharePanel = ({ link, isDirty = false, loadedShareId = null, onEntrar, onSalir, onCerrar }) => {
    const [errorLocal, setErrorLocal] = useState(null);
    const [descargando, setDescargando] = useState(false);
    const [verInsertar, setVerInsertar] = useState(false);
    const [mostrarCarga, setMostrarCarga] = useState(false);
    const [accionesQr, setAccionesQr] = useState(false);
    const [enlaceCompleto, setEnlaceCompleto] = useState(false);
    const { share, url, error, copied, includeAnnotations, annotationsCount } = link;
    const fijado = !!share?.pinned_until;
    const mensajeError = error || errorLocal;
    const esperando = !share && !mensajeError;

    useEffect(() => {
        if (!esperando) return undefined;
        const temporizador = setTimeout(() => setMostrarCarga(true), CARGA_DIFERIDA_MS);
        return () => clearTimeout(temporizador);
    }, [esperando]);

    const fijar = async () => {
        if (!share || fijado) return;
        try {
            const resultado = await pinShare(share.id);
            link.marcarFijado(resultado.pinnedUntil);
            trackShareMap('share_pin');
        } catch (err) {
            setErrorLocal(err.message || 'No se pudo fijar el enlace');
        }
    };

    const bajarQr = async () => {
        if (!url || descargando) return;
        setDescargando(true);
        trackShareMap('qr_download');
        try {
            await descargarQr(url, `mapalab-mapa-${share.id}`);
        } catch {
            setErrorLocal('No se pudo descargar el código QR');
        } finally {
            setDescargando(false);
        }
    };

    return (
        <PanelHoja
            titulo="Compartir mapa"
            extra={loadedShareId && (
                <span className="text-[10px] font-garet text-gray-400 tabular-nums">ID: {loadedShareId}</span>
            )}
            onCerrar={onCerrar}
            onMouseEnter={onEntrar}
            onMouseLeave={onSalir}
            className={`min-h-0 gap-3 ${HIDDEN_SCROLLBAR}`}
        >

            {isDirty && !share && (
                <p className="rounded-lg border border-orange/40 bg-[#FFF7EE] px-3 py-2 text-[11px]/[16px] font-garet text-[#7A4D00]">
                    <strong className="text-orange">Cambios sin guardar.</strong> El enlace nuevo conserva el mapa como está ahora.
                </p>
            )}

            {esperando && (mostrarCarga ? (
                <div role="status" aria-label="Generando enlace" className="flex justify-center h-12 items-center">
                    <Logo name="mapalab" isLoading size="size-10" />
                </div>
            ) : (
                <div className="h-12" aria-hidden="true" />
            ))}

            {share && url && (
                <div className="flex flex-col gap-1.5">
                    <div className="relative">
                        <Tooltip content={url} placement="top" delay={300} triggerBlock>
                            <input
                                type="text"
                                value={enlaceCompleto ? url : share.id}
                                readOnly
                                aria-label="Enlace del mapa"
                                onFocus={(evento) => {
                                    setEnlaceCompleto(true);
                                    requestAnimationFrame(() => evento.target.select());
                                }}
                                onBlur={() => setEnlaceCompleto(false)}
                                className="w-full py-4 pl-4 pr-15 border-none bg-[#EAEFFA] rounded-lg text-[13px]/[19px] text-[#191919] font-garet font-normal tracking-normal focus:outline-purple"
                            />
                        </Tooltip>
                        <Tooltip
                            content={copied ? '¡Enlace copiado!' : 'Copiar enlace'}
                            placement="top"
                            delay={300}
                            triggerClassName="absolute right-0 top-0 h-full"
                        >
                            <button
                                type="button"
                                onClick={link.copyLink}
                                className={`h-full w-12.75 rounded-r-lg flex items-center justify-center transition-colors cursor-pointer ${copied ? 'bg-[#16A34A]' : 'bg-purple-deep hover:bg-purple'}`}
                                aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                            >
                                <Icon name={copied ? 'shared_click' : 'copie'} state="hover" className="size-5" />
                            </button>
                        </Tooltip>
                    </div>
                    <Tooltip content={fijado ? RETENCION_FIJADO : RETENCION} placement="bottom" delay={300}>
                        <button
                            type="button"
                            onClick={fijar}
                            disabled={fijado}
                            className={`text-[12px] font-garet font-bold ${fijado ? 'text-[#16A34A] cursor-default' : 'text-orange hover:underline cursor-pointer'}`}
                        >
                            {fijado ? 'Enlace fijado por 1 año' : 'Fijar enlace por 1 año'}
                        </button>
                    </Tooltip>
                </div>
            )}

            {annotationsCount > 0 && (
                <Tooltip content="Guarda también tus mediciones y anotaciones en el enlace" placement="bottom" delay={400} triggerBlock>
                    <div className="flex items-center gap-2">
                        <Checkbox checked={includeAnnotations} onChange={link.alternarAnotaciones} />
                        <span className="text-[11px]/[16px] font-garet text-graphite">
                            Incluir mis mediciones y anotaciones ({annotationsCount})
                        </span>
                    </div>
                </Tooltip>
            )}

            {share && url && (
                <div className="bg-white rounded-[14px] p-3 flex justify-center">
                    <div className="group relative">
                        <BrandedQr url={url} size={QR_PANEL} />
                        <button
                            type="button"
                            onClick={() => setAccionesQr((visible) => !visible)}
                            aria-expanded={accionesQr}
                            aria-label="Mostrar opciones del código QR"
                            className="absolute inset-0 rounded-[10px] cursor-pointer"
                        />
                        <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 px-4 text-center bg-white/90 rounded-[10px] transition-opacity duration-150 ${accionesQr ? 'opacity-100' : QR_OCULTO}`}>
                            <span className="text-[12px]/[16px] font-garet text-graphite">Escanéalo o úsalo en una presentación</span>
                            <button
                                type="button"
                                onClick={bajarQr}
                                disabled={descargando}
                                className={`h-9 px-5 rounded-[30px] bg-orange text-white hover:bg-[#E07400] font-garet font-bold text-[12px] cursor-pointer disabled:opacity-60 ${accionesQr ? 'pointer-events-auto' : QR_BOTON_OCULTO}`}
                            >
                                {descargando ? 'Descargando…' : 'Descargar PNG'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {share && url && (
                <div className="flex justify-center gap-3">
                    {REDES_COMPARTIR.map((red) => (
                        <Tooltip key={red.id} content={red.etiqueta} placement="top" delay={300}>
                            <a
                                href={red.construir(url, TEXTO_COMPARTIR)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackShareMap(`red_${red.id}`)}
                                aria-label={`Compartir en ${red.etiqueta}`}
                                className={CLASE_RED}
                            >
                                <IconoRed red={red} />
                            </a>
                        </Tooltip>
                    ))}
                </div>
            )}

            {share && (
                <div className="flex justify-center mt-2">
                    <Tooltip content="Muestra el código para insertar este mapa en otra página" placement="top" delay={400}>
                        <button
                            type="button"
                            onClick={() => setVerInsertar((visible) => !visible)}
                            aria-expanded={verInsertar}
                            className="inline-flex items-center gap-1.5 text-[12px] font-garet font-bold text-purple hover:underline cursor-pointer"
                        >
                            Insertar en otra página
                            <Badge variant="pill" color="orange" text="BETA" className="text-[8px]/[12px] px-1.5" />
                        </button>
                    </Tooltip>
                </div>
            )}

            {share && verInsertar && <ShareEmbed shareId={share.id} />}

            {mensajeError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[11px]/[16px] font-garet text-red-700 flex items-start gap-2">
                    <span className="flex-1">{mensajeError}</span>
                    <button
                        type="button"
                        onClick={() => { setErrorLocal(null); if (error) link.ensureShare(); }}
                        className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                    >
                        {error ? 'Reintentar' : '×'}
                    </button>
                </div>
            )}
        </PanelHoja>
    );
};

export default SharePanel;
