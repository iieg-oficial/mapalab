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

export const fetchVectorFeatures = async (wmsConfig, cqlFilter, signal) => {
    const url = buildVectorWFSUrl(wmsConfig, cqlFilter);
    return parseResponse(await fetch(url, fetchOptions(signal)));
};
