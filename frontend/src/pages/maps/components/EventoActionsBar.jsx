import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Switch from '@components/Switch';
import Tooltip from '@components/Tooltip';
import EventoFunButton from '@mapsComponents/EventoFunButton';
import { useMapsContext } from '@hooks/useMaps';
import { slugifyTitulo } from '@pages/maps/helpers/eventoHelpers';
import { trackEventoCenter, trackEventoShare } from '@services/analyticsService';

const ICON_BUTTON = 'w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] hover:scale-110 active:scale-95 transition-transform cursor-pointer';
const ICON_BUTTON_COPIED = 'w-7 h-7 md:w-6 md:h-6 rounded-full bg-[#DCFCE7] border border-[#22C55E] flex items-center justify-center shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] transition-transform cursor-default';
const PILL_STATIC = 'px-2.5 py-1.5 rounded-full border border-transparent bg-[#F9FBFF] flex items-center gap-1.5';
const LABEL_CLASS = 'font-garet text-[12px] text-graphite';

const buildEventoShareUrl = (evento) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    const slug = evento?.slug || slugifyTitulo(evento?.titulo) || evento?.id;
    return `${base}${path}mapa?evento=${encodeURIComponent(slug)}`;
};

const EventoActionsBar = ({ evento, externalActiveIds = [], onCenterEvento }) => {
    const { hiddenLayerIds, setHiddenLayerIds } = useMapsContext();
    const [soloEvento, setSoloEvento] = useState(false);
    const [copied, setCopied] = useState(false);
    const hiddenIdsRef = useRef(hiddenLayerIds);
    const addedByUsRef = useRef(new Set());
    const copyTimerRef = useRef(null);

    useEffect(() => { hiddenIdsRef.current = hiddenLayerIds; }, [hiddenLayerIds]);

    useEffect(() => () => clearTimeout(copyTimerRef.current), []);

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

    const handleShareEvento = async () => {
        if (!evento) return;
        const url = buildEventoShareUrl(evento);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            clearTimeout(copyTimerRef.current);
            copyTimerRef.current = setTimeout(() => setCopied(false), 2500);
            trackEventoShare(evento.id, 'copied');
        } catch {
            window.prompt('Selecciona y copia este enlace:', url);
            trackEventoShare(evento.id, 'prompt');
        }
    };

    const shareTooltip = copied
        ? '¡Enlace copiado!'
        : 'Copiar enlace permanente del evento';

    return (
        <div className="mx-4 mt-1 mb-2 px-2 py-1.5 rounded-full border border-transparent bg-[#F9FBFF] flex items-center gap-2 shrink-0">
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
                <Tooltip content={shareTooltip} placement="top" delay={300}>
                    <button
                        type="button"
                        onClick={handleShareEvento}
                        aria-label={shareTooltip}
                        className={copied ? ICON_BUTTON_COPIED : ICON_BUTTON}
                    >
                        <Icon
                            name={copied ? 'shared_click' : 'copie'}
                            className="size-3.5"
                        />
                    </button>
                </Tooltip>
                <EventoFunButton evento={evento} />
            </div>
        </div>
    );
};

export default EventoActionsBar;
