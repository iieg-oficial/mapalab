import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Message from '@components/Message';
import AnchoredNotice from '@mapsComponents/LayerNotices/AnchoredNotice';
import { MobileFactBanner } from '@mapsComponents/EventoFunPopover';
import { useRecorridoBatalla } from '@hooksMaps/useRecorridoBatalla';
import { trackEventoFunRecorrido } from '@services/analyticsService';

const detener = (e) => e.stopPropagation();

const EventoFunPin = ({ pin, onVolver, onCerrar }) => {
    const ref = useRef(null);
    const { disponible, recorriendo, recorrer } = useRecorridoBatalla();
    const vertices = Array.isArray(pin.vertices) ? pin.vertices : [];
    const conRecorrido = disponible && vertices.length > 1;

    const verRecorrido = () => {
        if (pin.eventoId) trackEventoFunRecorrido(pin.eventoId, vertices.length);
        recorrer(vertices);
    };

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        el.addEventListener('pointerdown', detener);
        return () => el.removeEventListener('pointerdown', detener);
    }, []);

    return (
        <>
            <AnchoredNotice coord={pin} arrowPosition="bottom">
                <div ref={ref} className="flex flex-col items-center translate-y-[7px]">
                    <div className="w-[min(320px,calc(100vw-32px))]">
                        <Message variant="info" size="small" icon="" title={null} description={pin.texto} closable onClose={onCerrar}>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onVolver}
                                    className="text-[12px] font-bold text-orange hover:underline cursor-pointer"
                                >
                                    Volver
                                </button>
                                {conRecorrido && (
                                    <button
                                        type="button"
                                        onClick={verRecorrido}
                                        disabled={recorriendo}
                                        className="text-[12px] font-bold text-purple hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-default"
                                    >
                                        {recorriendo ? 'Recorriendo…' : 'Ver el recorrido en 3D'}
                                    </button>
                                )}
                            </div>
                        </Message>
                    </div>
                    <span aria-hidden="true" className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]" />
                    <span aria-hidden="true" className="mt-1 size-3.5 rounded-full bg-orange border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
                </div>
            </AnchoredNotice>
            {recorriendo && createPortal(<MobileFactBanner popover={{ text: pin.texto }} />, document.body)}
        </>
    );
};

export default EventoFunPin;
