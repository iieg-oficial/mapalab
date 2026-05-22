import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import Switch from '@components/Switch';
import Tooltip from '@components/Tooltip';
import ReportButton from '@components/ReportButton';
import EventoFunButton from '@mapsComponents/EventoFunButton';
import { useMapsContext } from '@hooks/useMaps';
import { trackEventoCenter, trackEventoReport } from '@services/analyticsService';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const ICON_BUTTON = 'w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] hover:scale-110 active:scale-95 transition-transform cursor-pointer';
const PILL_STATIC = 'px-2.5 py-1.5 rounded-full border border-transparent bg-[#F9FBFF] flex items-center gap-1.5';
const LABEL_CLASS = 'font-garet text-[12px] text-graphite';

const EventoActionsBar = ({ evento, externalActiveIds = [], onCenterEvento }) => {
    const { hiddenLayerIds, setHiddenLayerIds } = useMapsContext();
    const [soloEvento, setSoloEvento] = useState(false);
    const hiddenIdsRef = useRef(hiddenLayerIds);
    const addedByUsRef = useRef(new Set());

    useEffect(() => { hiddenIdsRef.current = hiddenLayerIds; }, [hiddenLayerIds]);

    useEffect(() => {
        if (typeof setHiddenLayerIds !== 'function') return undefined;
        if (soloEvento) {
            const current = hiddenIdsRef.current || [];
            const toHide = (externalActiveIds || []).filter((id) => !current.includes(id));
            if (toHide.length === 0) return undefined;
            toHide.forEach((id) => addedByUsRef.current.add(id));
            setHiddenLayerIds((prev) => Array.from(new Set([...(prev || []), ...toHide])));
            return undefined;
        }
        if (addedByUsRef.current.size === 0) return undefined;
        const restored = new Set(addedByUsRef.current);
        addedByUsRef.current = new Set();
        setHiddenLayerIds((prev) => (prev || []).filter((id) => !restored.has(id)));
        return undefined;
    }, [soloEvento, externalActiveIds, setHiddenLayerIds]);

    const externalCount = externalActiveIds?.length || 0;
    const isPlural = externalCount !== 1;
    const soloTooltip = soloEvento
        ? 'Oculta las capas externas a este evento mientras este encendido. Al apagarlo, vuelven a ser visibles.'
        : externalCount > 0
            ? `Activar para ocultar ${externalCount} capa${isPlural ? 's' : ''} externa${isPlural ? 's' : ''} (no se eliminan, solo se ocultan)`
            : 'Oculta automaticamente las capas que no pertenecen a este evento';

    const canCenter = typeof onCenterEvento === 'function' && Boolean(evento?.bbox);
    const handleCenter = () => {
        if (!canCenter) return;
        onCenterEvento();
        if (evento?.id) trackEventoCenter(evento.id);
    };

    const containerClass = IS_NON_PROD
        ? 'mx-4 mt-1 mb-2 px-2 py-1.5 rounded-full border border-orange flex items-center gap-2 shrink-0'
        : 'mx-4 mt-1 mb-2 px-2 py-1.5 rounded-full border border-transparent bg-[#F9FBFF] flex items-center gap-2 shrink-0';

    return (
        <div className={containerClass}>
            {IS_NON_PROD && <Badge variant="pill" text="beta" color="orange" size="sm" />}

            <Tooltip content={soloTooltip}>
                <div className={PILL_STATIC}>
                    <Switch checked={soloEvento} onChange={setSoloEvento} />
                    <span className={LABEL_CLASS}>Solo este evento</span>
                </div>
            </Tooltip>

            <div className="ml-auto flex items-center gap-1.5">
                {canCenter && (
                    <Tooltip content="Centrar mapa en el evento" placement="top" delay={300}>
                        <button
                            type="button"
                            onClick={handleCenter}
                            aria-label="Centrar mapa en el evento"
                            className={ICON_BUTTON}
                        >
                            <Icon name="fit_extent" className="size-3.5" />
                        </button>
                    </Tooltip>
                )}
                <EventoFunButton evento={evento} />
                {IS_NON_PROD && (
                    <ReportButton
                        variant="floating"
                        label="Reportar problema con este evento"
                        extraContext={{
                            source: 'evento_actions_bar',
                            evento_id: evento?.id,
                            evento_titulo: evento?.titulo,
                        }}
                        onTrack={() => evento?.id && trackEventoReport(evento.id)}
                    />
                )}
            </div>
        </div>
    );
};

export default EventoActionsBar;
