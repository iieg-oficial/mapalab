import { useCallback } from 'react';
import { downloadFeaturesAsCSV } from '../utils/downloadFeatures';

export const TOPE_DESCARGA_POLIGONO = 5000;

const tarjetas = (cantidad) => (cantidad === 1 ? 'tarjeta' : 'tarjetas');

export const useDescargaDeInfoBox = ({ selectedFeatureInfo, lazyLoad, allLayers, pedirParaDescarga }) => {
    const matched = selectedFeatureInfo?.matched || 0;
    const dePoligono = !!selectedFeatureInfo?.isPolygonSelection && (matched > 0 || !!selectedFeatureInfo?.resumen?.length);
    const { enrichResultsForDownload } = lazyLoad;

    const descargar = useCallback(async () => {
        const resultados = dePoligono
            ? (await pedirParaDescarga?.(TOPE_DESCARGA_POLIGONO))?.results
            : await enrichResultsForDownload();
        if (resultados?.length) downloadFeaturesAsCSV(resultados, allLayers);
    }, [dePoligono, pedirParaDescarga, enrichResultsForDownload, allLayers]);

    if (!dePoligono) {
        return {
            onDownload: lazyLoad.totalFeatures > 1 ? descargar : null,
            downloadCount: lazyLoad.downloadDisplayCount,
            downloadShowsPlus: lazyLoad.downloadShowsPlus,
            downloadTooltip: lazyLoad.downloadTooltipText,
        };
    }

    const cantidad = Math.min(matched, TOPE_DESCARGA_POLIGONO);
    const excede = matched > TOPE_DESCARGA_POLIGONO;
    return {
        onDownload: descargar,
        downloadCount: cantidad,
        downloadShowsPlus: excede,
        downloadTooltip: excede
            ? `Descargar ${cantidad} de ${matched} tarjetas (cap ${TOPE_DESCARGA_POLIGONO})`
            : `Descargar ${cantidad} ${tarjetas(cantidad)}`,
    };
};
