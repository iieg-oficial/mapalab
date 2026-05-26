import { useCallback, useEffect, useRef } from 'react';
import { unionGeometriesExtent } from '@pages/maps/helpers/municipioMask';

export const useMunicipioFit = ({ municipioMode, mapRef, paneMapInstances, swipeCompareModeActive }) => {
    const lastFittedSelectionRef = useRef(null);

    const centerOnSelection = useCallback(() => {
        const geomItems = (municipioMode.geometries || []).filter(g => g?.geometry);
        if (geomItems.length === 0) return false;
        const extent = unionGeometriesExtent(geomItems.map(g => g.geometry));
        if (!extent) return false;
        const fit = (map) => {
            if (!map) return;
            try {
                map.getView().fit(extent, {
                    duration: 500,
                    padding: [80, 80, 80, 80],
                    maxZoom: 13,
                });
            } catch (err) {
                console.debug('No se pudo hacer fit a la selección de municipios', err);
            }
        };
        if (swipeCompareModeActive) {
            Object.values(paneMapInstances || {}).forEach(fit);
        } else {
            fit(mapRef.current);
        }
        return true;
    }, [municipioMode.geometries, paneMapInstances, swipeCompareModeActive, mapRef]);

    useEffect(() => {
        if (!municipioMode.active) {
            lastFittedSelectionRef.current = null;
            return;
        }
        const geomItems = (municipioMode.geometries || []).filter(g => g?.geometry);
        if (geomItems.length === 0) return;
        const selectedSorted = (municipioMode.selected || []).map(String).slice().sort();
        const geomClavesSorted = geomItems.map(g => String(g.clave)).slice().sort();
        if (selectedSorted.join(',') !== geomClavesSorted.join(',')) return;
        const key = geomClavesSorted.join(',');
        if (lastFittedSelectionRef.current === key) return;
        if (centerOnSelection()) {
            lastFittedSelectionRef.current = key;
        }
    }, [municipioMode.active, municipioMode.geometries, municipioMode.selected, centerOnSelection]);

    return centerOnSelection;
};
