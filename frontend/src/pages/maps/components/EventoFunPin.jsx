import { useEffect, useRef } from 'react';
import Message from '@components/Message';
import AnchoredNotice from '@mapsComponents/LayerNotices/AnchoredNotice';

const detener = (e) => e.stopPropagation();

const EventoFunPin = ({ pin, onVolver, onCerrar }) => {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        el.addEventListener('pointerdown', detener);
        return () => el.removeEventListener('pointerdown', detener);
    }, []);

    return (
        <AnchoredNotice coord={pin} arrowPosition="bottom">
            <div ref={ref} className="flex flex-col items-center translate-y-[7px]">
                <div className="w-[min(320px,calc(100vw-32px))]">
                    <Message variant="info" size="small" icon="" title={null} description={pin.texto} closable onClose={onCerrar}>
                        <button
                            type="button"
                            onClick={onVolver}
                            className="mt-1.5 text-[12px] font-bold text-orange hover:underline cursor-pointer"
                        >
                            Volver
                        </button>
                    </Message>
                </div>
                <span aria-hidden="true" className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]" />
                <span aria-hidden="true" className="mt-1 size-3.5 rounded-full bg-orange border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
            </div>
        </AnchoredNotice>
    );
};

export default EventoFunPin;
