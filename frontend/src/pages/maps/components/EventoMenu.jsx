import { useEffect, useMemo, useRef } from 'react';
import { transformExtent } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import ThemeMenu from '@mapsComponents/ThemeMenu';


const layerWorkspace = (n) =>
    n.workspaceAlias || n.wmsConfig?.workspace || n.wmsConfig?.geoserverWorkspace || null;

const layerName = (n) =>
    n.geoserverLayer || n.wmsConfig?.geoserverLayer || n.wmsConfig?.wmsGroup || null;

const findLayerByWorkspaceLayer = (workspace, layer, nodes) => {
    for (const node of nodes || []) {
        if (layerWorkspace(node) === workspace && layerName(node) === layer) {
            return node;
        }
        if (node.children?.length) {
            const found = findLayerByWorkspaceLayer(workspace, layer, node.children);
            if (found) return found;
        }
    }
    return null;
};


const EventoMenu = ({ evento, activeLayerIds, onToggleLayer, closeButton }) => {
    const { mapRef, allLayers } = useMapsContext();
    const zoomedRef = useRef(false);
    const autoActivatedRef = useRef(false);

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

    const eventoLayerIds = useMemo(() => {
        const ids = new Set();
        if (!evento?.capas?.length || !allLayers?.length) return ids;
        for (const c of evento.capas) {
            if (c.tipo === 'etiqueta') continue;
            const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
            if (layer) ids.add(layer.id);
        }
        return ids;
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
        if (toActivate.length === 0) return;
        autoActivatedRef.current = true;
        toActivate.forEach((id) => onToggleLayer(id, true));
    }, [evento, allLayers, onToggleLayer]);

    const externalActiveIds = useMemo(() => (
        (activeLayerIds || []).filter((id) => !eventoLayerIds.has(id))
    ), [activeLayerIds, eventoLayerIds]);

    const handleApagarExternas = () => {
        if (!onToggleLayer || externalActiveIds.length === 0) return;
        externalActiveIds.forEach((id) => onToggleLayer(id, false));
    };

    const headerExtras = (
        <div className="flex items-center gap-1">
            {externalActiveIds.length > 0 && (
                <button
                    type="button"
                    onClick={handleApagarExternas}
                    title={`Eliminar ${externalActiveIds.length} capa${externalActiveIds.length === 1 ? '' : 's'} fuera del evento`}
                    className="px-2 py-1 rounded-md text-[11px] font-bold text-[#5C2472] hover:bg-[#F0E6F6] transition-colors cursor-pointer"
                >
                    Eliminar ({externalActiveIds.length})
                </button>
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
