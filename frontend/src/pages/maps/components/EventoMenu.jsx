import { useEffect, useMemo, useRef, useState } from 'react';
import { transformExtent } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useEventoContext } from '@hooks/useEvento';
import ThemeMenu from '@mapsComponents/ThemeMenu';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { findLayerByWorkspaceLayer } from '@pages/maps/helpers/eventoHelpers';
import { trackEventoClose, trackEventoOpen } from '@services/analyticsService';


const EventoMenu = ({ evento, activeLayerIds, onToggleLayer, closeButton }) => {
    const { mapRef, allLayers } = useMapsContext();
    const { setActiveEvento, getLayerIdsByEvento } = useEventoContext();
    const zoomedRef = useRef(false);
    const autoActivatedRef = useRef(false);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);

    useEffect(() => {
        if (!evento?.id) return;
        trackEventoOpen(evento.id, evento.titulo);
        return () => trackEventoClose(evento.id);
    }, [evento?.id, evento?.titulo]);

    useEffect(() => {
        if (zoomedRef.current) return;
        const bbox = evento?.bbox;
        if (!mapRef?.current || !bbox) return;

        const view = mapRef.current.getView();
        const extent = transformExtent(
            [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy],
            'EPSG:4326',
            'EPSG:3857',
        );
        const size = mapRef.current.getSize();
        const shortSide = size ? Math.min(size[0], size[1]) : 800;
        const pad = Math.round(shortSide * 0.08);
        view.fit(extent, { duration: 500, padding: [pad, pad, pad, pad] });
        zoomedRef.current = true;
    }, [evento, mapRef]);

    const eventoLayerIds = useMemo(
        () => getLayerIdsByEvento(evento?.id),
        [getLayerIdsByEvento, evento?.id],
    );

    const themeChildren = useMemo(() => {
        if (!evento?.capas?.length || !allLayers?.length) return [];
        return evento.capas
            .map((c, idx) => {
                if (c.tipo === 'etiqueta') {
                    return {
                        id: `evento-etiqueta-${evento.id}-${idx}`,
                        label: c.alias || '',
                        isLabel: true,
                    };
                }
                const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
                if (!layer) return null;
                return c.alias ? { ...layer, label: c.alias } : layer;
            })
            .filter(Boolean);
    }, [evento, allLayers]);

    const activeIdsRef = useRef(activeLayerIds);
    useEffect(() => { activeIdsRef.current = activeLayerIds; }, [activeLayerIds]);

    useEffect(() => {
        if (autoActivatedRef.current) return;
        if (!evento?.capas?.length || !allLayers?.length || !onToggleLayer) return;

        const toActivate = [];
        for (const c of evento.capas) {
            if (c.tipo === 'etiqueta') continue;
            if (c.autoActivar === false) continue;
            const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
            if (layer && !activeIdsRef.current?.includes(layer.id)) {
                toActivate.push(layer.id);
            }
        }
        autoActivatedRef.current = true;
        toActivate.forEach((id) => onToggleLayer(id, true));
    }, [evento, allLayers, onToggleLayer]);

    const externalActiveIds = useMemo(() => (
        (activeLayerIds || []).filter((id) => !eventoLayerIds.has(id))
    ), [activeLayerIds, eventoLayerIds]);

    const layerIdsKey = useMemo(
        () => Array.from(eventoLayerIds).sort().join('|'),
        [eventoLayerIds],
    );

    useEffect(() => {
        if (!evento?.id || !setActiveEvento) return;
        setActiveEvento({
            id: evento.id,
            titulo: evento.titulo,
            iconoUrl: evento.iconoUrl,
            imagenUrl: evento.imagenUrl,
            layerIds: layerIdsKey ? layerIdsKey.split('|') : [],
        });
        return () => {
            setActiveEvento((current) => (current?.id === evento.id ? null : current));
        };
    }, [evento?.id, evento?.titulo, evento?.iconoUrl, evento?.imagenUrl, layerIdsKey, setActiveEvento]);

    const handleApagarExternas = () => {
        if (!onToggleLayer || externalActiveIds.length === 0) return;
        externalActiveIds.forEach((id) => onToggleLayer(id, false));
    };

    const externalCount = externalActiveIds.length;
    const isPlural = externalCount !== 1;
    const headerExtras = (
        <div className="flex items-center gap-1">
            {externalCount > 0 && (
                <Tooltip content={`Apagar ${externalCount} capa${isPlural ? 's' : ''} activa${isPlural ? 's' : ''} que no pertenece${isPlural ? 'n' : ''} a este evento`}>
                    <button
                        type="button"
                        onClick={handleApagarExternas}
                        onMouseEnter={() => setIsDeleteHovered(true)}
                        onMouseLeave={() => setIsDeleteHovered(false)}
                        className="relative p-1.5 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF] hover:border-[#FF577D]"
                    >
                        <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className="size-5" />
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF577D] text-white text-[10px] font-bold leading-4 text-center">
                            {externalCount}
                        </span>
                    </button>
                </Tooltip>
            )}
            {closeButton}
        </div>
    );

    const theme = useMemo(() => ({
        id: `evento-${evento?.id}`,
        label: evento?.titulo || 'Evento',
        children: themeChildren,
    }), [evento, themeChildren]);

    return (
        <ThemeMenu
            theme={theme}
            activeLayerIds={activeLayerIds}
            onToggleLayer={onToggleLayer}
            closeButton={headerExtras}
        />
    );
};

export default EventoMenu;
