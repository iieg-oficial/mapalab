import { useCallback } from 'react';
import { toLonLat } from 'ol/proj';
import { trackCatalogoFeatureClick } from '@services/analyticsService';
import { FEATURE_COUNT_CAP } from '@services/featureInfoService';
import { geojson } from '../helpers/catalogoMapLayer';

const aFeaturesOl = (features) => features
    .filter((f) => f?.geometry)
    .map((f) => {
        try {
            return geojson.readFeature(f, { dataProjection: 'EPSG:3857', featureProjection: 'EPSG:3857' });
        } catch {
            return null;
        }
    })
    .filter(Boolean);

export const useCatalogoConsulta = ({ mapRef, wmsLayerRef, capaRef, clickSeqRef, highlightSourceRef, setInfo, clearInfo }) => useCallback(async (coordinate, pixel) => {
    const map = mapRef.current;
    const layer = wmsLayerRef.current;
    if (!map || !layer) {
        clearInfo();
        return;
    }
    const view = map.getView();
    const url = layer.getSource().getFeatureInfoUrl(
        coordinate,
        view.getResolution(),
        view.getProjection(),
        { INFO_FORMAT: 'application/json', FEATURE_COUNT: FEATURE_COUNT_CAP },
    );
    if (!url) return;
    const seq = ++clickSeqRef.current;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (seq !== clickSeqRef.current) return;
        const features = data?.features || [];
        trackCatalogoFeatureClick({ slug: capaRef.current?.slug || null, count: features.length });
        const [lng, lat] = toLonLat(coordinate);
        setInfo({ features, pixel, lngLat: { lng, lat } });
        highlightSourceRef.current?.clear();
        if (features.length) highlightSourceRef.current?.addFeatures(aFeaturesOl(features));
    } catch {
        if (seq === clickSeqRef.current) clearInfo();
    }
}, [mapRef, wmsLayerRef, capaRef, clickSeqRef, highlightSourceRef, setInfo, clearInfo]);
