import { useCallback, useEffect, useMemo, useRef } from 'react';
import { transformExtent } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useEventoContext } from '@hooks/useEvento';
import { useSider } from '@contexts/SiderContext';
import { getFitPadding, ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import ThemeMenu from '@mapsComponents/ThemeMenu';
import EventoActionsBar from '@mapsComponents/EventoActionsBar';
import { findLayerByWorkspaceLayer } from '@pages/maps/helpers/eventoHelpers';
import { trackEventoClose, trackEventoOpen } from '@services/analyticsService';


const EventoMenu = ({ evento, activeLayerIds, onToggleLayer, closeButton }) => {
    const { mapRef, allLayers, setBaseMapId } = useMapsContext();
    const { setActiveEvento, getLayerIdsByEvento } = useEventoContext();
    const { width: siderWidth, isMobile } = useSider();
    const zoomedRef = useRef(false);
    const autoActivatedRef = useRef(false);

    useEffect(() => {
        if (!evento?.id) return;
        trackEventoOpen(evento.id, evento.titulo);
        return () => trackEventoClose(evento.id);
    }, [evento?.id, evento?.titulo]);

    useEffect(() => {
        const target = evento?.basemapId;
        if (!target || typeof setBaseMapId !== 'function') return;
        setBaseMapId(target);
    }, [evento?.id, evento?.basemapId, setBaseMapId]);

    const eventoLayerIds = useMemo(
        () => getLayerIdsByEvento(evento?.id),
        [getLayerIdsByEvento, evento?.id],
    );

    const centerOnEvento = useCallback(() => {
        const bbox = evento?.bbox;
        if (!mapRef?.current || !bbox) return false;
        const view = mapRef.current.getView();
        const extent = transformExtent(
            [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy],
            'EPSG:4326',
            'EPSG:3857',
        );
        const padding = getFitPadding({ mapSize: mapRef.current.getSize(), siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        view.fit(extent, { duration: 500, padding });
        return true;
    }, [evento?.bbox, mapRef, siderWidth, isMobile]);

    useEffect(() => {
        if (zoomedRef.current) return;
        if (!evento?.bbox) return;
        const activeIds = activeLayerIds || [];
        if (eventoLayerIds.size > 0 && activeIds.some((id) => eventoLayerIds.has(id))) {
            zoomedRef.current = true;
            return;
        }
        if (centerOnEvento()) zoomedRef.current = true;
    }, [evento?.bbox, eventoLayerIds, activeLayerIds, centerOnEvento]);

    const themeChildren = useMemo(() => {
        if (!evento?.capas?.length || !allLayers?.length) return [];
        const buildNode = (c, idx, parentId, allowCategory) => {
            if (c.tipo === 'etiqueta') {
                return { id: `${parentId}-etiqueta-${idx}`, label: c.alias || '', isLabel: true };
            }
            if (c.tipo === 'categoria') {
                if (!allowCategory) return null;
                const catId = `${parentId}-categoria-${idx}`;
                return {
                    id: catId,
                    label: c.alias || '',
                    isCategory: true,
                    children: (c.capas || [])
                        .map((child, j) => buildNode(child, j, catId, false))
                        .filter(Boolean),
                };
            }
            const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
            if (!layer) return null;
            return c.alias ? { ...layer, label: c.alias } : layer;
        };
        const rootId = `evento-${evento.id}`;
        return evento.capas
            .map((c, idx) => buildNode(c, idx, rootId, true))
            .filter(Boolean);
    }, [evento, allLayers]);

    const activeIdsRef = useRef(activeLayerIds);
    useEffect(() => { activeIdsRef.current = activeLayerIds; }, [activeLayerIds]);

    useEffect(() => {
        if (autoActivatedRef.current) return;
        if (!evento?.capas?.length || !allLayers?.length || !onToggleLayer) return;

        const activeIds = activeIdsRef.current || [];
        if (eventoLayerIds.size > 0 && activeIds.some((id) => eventoLayerIds.has(id))) {
            autoActivatedRef.current = true;
            return;
        }

        const toActivate = [];
        const walk = (capas) => {
            for (const c of capas || []) {
                if (c.tipo === 'etiqueta') continue;
                if (c.tipo === 'categoria') { walk(c.capas); continue; }
                if (c.autoActivar === false) continue;
                const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
                if (layer && !activeIds.includes(layer.id)) {
                    toActivate.push({ id: layer.id, z: typeof c.z === 'number' ? c.z : null });
                }
            }
        };
        walk(evento.capas);
        autoActivatedRef.current = true;
        toActivate.sort((a, b) => {
            if (a.z == null && b.z == null) return 0;
            if (a.z == null) return -1;
            if (b.z == null) return 1;
            return a.z - b.z;
        });
        const analytics = { source: 'evento_open', evento_id: evento.id };
        toActivate.forEach(({ id }) => onToggleLayer(id, true, { analytics }));
    }, [evento, allLayers, onToggleLayer, eventoLayerIds]);

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
            closeButton={closeButton}
            actionsBar={(
                <EventoActionsBar
                    evento={evento}
                    externalActiveIds={externalActiveIds}
                    onCenterEvento={centerOnEvento}
                />
            )}
        />
    );
};

export default EventoMenu;
