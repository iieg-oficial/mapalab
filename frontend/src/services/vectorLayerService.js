import { getWfsUrl, parseResponse } from '@utils/featureInfoUtils';

export const VECTOR_PROJECTION = 'EPSG:3857';

const REQUEST_TIMEOUT_MS = 30000;

const fetchOptions = (signal) => ({ signal: signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

const buildParams = (wmsConfig, cqlFilter) => {
    const params = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: wmsConfig.wfsLayerName || wmsConfig.layerName,
        outputFormat: 'application/json',
        srsName: VECTOR_PROJECTION
    };
    if (cqlFilter) params.CQL_FILTER = cqlFilter;
    return params;
};

export const buildVectorWFSUrl = (wmsConfig, cqlFilter, extraParams = null) => {
    const baseUrl = getWfsUrl(wmsConfig.baseUrl || '');
    const params = { ...buildParams(wmsConfig, cqlFilter), ...(extraParams || {}) };
    return `${baseUrl}?${new URLSearchParams(params).toString()}`;
};

const NUMBER_MATCHED_XML = /numberMatched="(\d+)"/;

export const countVectorFeatures = async (wmsConfig, cqlFilter, signal) => {
    const url = buildVectorWFSUrl(wmsConfig, cqlFilter, { resultType: 'hits' });
    const response = await fetch(url, fetchOptions(signal));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const body = await response.text();

    const fromXml = NUMBER_MATCHED_XML.exec(body);
    if (fromXml) return Number.parseInt(fromXml[1], 10);

    try {
        const matched = Number.parseInt(JSON.parse(body)?.numberMatched, 10);
        return Number.isFinite(matched) ? matched : null;
    } catch {
        return null;
    }
};

const COORDENADAS_VALIDAS = "-179.9,-80,179.9,80,'EPSG:4326'";
const ERROR_DE_REPROYECCION = /reprojecting|too close to a pole/i;

export const acotarAGeometriasValidas = (cqlFilter, geometria) => {
    const bbox = `BBOX(${geometria},${COORDENADAS_VALIDAS})`;
    return cqlFilter ? `(${cqlFilter}) AND ${bbox}` : bbox;
};

const geometriaDe = async (wmsConfig, signal) => {
    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'DescribeFeatureType',
        typeNames: wmsConfig.wfsLayerName || wmsConfig.layerName,
        outputFormat: 'application/json',
    });
    const response = await fetch(`${getWfsUrl(wmsConfig.baseUrl || '')}?${params.toString()}`, fetchOptions(signal));
    if (!response.ok) return null;
    const json = await response.json();
    return (json?.featureTypes?.[0]?.properties || []).find(p => String(p.type).startsWith('gml:'))?.name || null;
};

export const fetchVectorFeatures = async (wmsConfig, cqlFilter, signal) => {
    const response = await fetch(buildVectorWFSUrl(wmsConfig, cqlFilter), fetchOptions(signal));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    if (!(response.headers.get('content-type') || '').includes('application/json')) return parseResponse(response);
    const texto = await response.text();
    try {
        return JSON.parse(texto);
    } catch (error) {
        if (!ERROR_DE_REPROYECCION.test(texto)) throw error;
        const geometria = await geometriaDe(wmsConfig, signal);
        if (!geometria) throw error;
        return parseResponse(await fetch(buildVectorWFSUrl(wmsConfig, acotarAGeometriasValidas(cqlFilter, geometria)), fetchOptions(signal)));
    }
};
