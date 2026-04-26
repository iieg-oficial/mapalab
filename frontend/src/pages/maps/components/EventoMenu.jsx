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
            .map((c) => {
                const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
                if (!layer) return null;
                return c.alias ? { ...layer, label: c.alias } : layer;
            })
            .filter(Boolean);
    }, [evento, allLayers]);

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
        />
    );
};

export default EventoMenu;
