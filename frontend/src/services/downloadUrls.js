export const VECTOR_FORMATS = [
    { id: 'geopackage', label: 'GPKG', extension: 'gpkg', mimeType: 'application/geopackage+sqlite3', srs: 'EPSG:6368' },
    { id: 'shape-zip', label: 'SHP', extension: 'shp.zip', mimeType: 'application/zip', srs: 'EPSG:4326' },
    { id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv', srs: 'EPSG:4326' }
];

export const RASTER_FORMATS = [
    { id: 'geotiff', label: 'GeoTIFF', extension: 'tiff' }
];

export const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);

export const findVectorFormat = (formatId) => VECTOR_FORMATS.find(f => f.id === formatId);

export const supportsFileSystemAccess = () =>
    typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

const getApiHost = () => import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');

export const buildWFSUrl = (wmsConfig, format, cqlFilter, propertyNames) => {
    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');
    const params = {
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: wmsConfig.wfsLayerName || wmsConfig.layerName,
        outputFormat: format.id,
        srsName: format.srs || 'EPSG:4326'
    };
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    if (Array.isArray(propertyNames) && propertyNames.length) {
        url.searchParams.append('propertyName', propertyNames.join(','));
    }
    const parts = [wmsConfig.cqlFilter, cqlFilter].filter(Boolean);
    if (parts.length) {
        const filter = parts.length === 1 ? parts[0] : parts.map(p => `(${p})`).join(' AND ');
        url.searchParams.append('CQL_FILTER', filter);
    }
    return url.toString();
};

const GEOMETRY_LOCAL_TYPES = new Set([
    'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Curve', 'MultiCurve',
    'Polygon', 'MultiPolygon', 'Surface', 'MultiSurface', 'Geometry', 'GeometryCollection',
]);

const isGeometryProperty = (prop) => {
    if (typeof prop?.type === 'string' && prop.type.startsWith('gml:')) return true;
    return GEOMETRY_LOCAL_TYPES.has(prop?.localType);
};

const nonGeomColumnsCache = new Map();

export const fetchNonGeometryColumns = async (wmsConfig, signal) => {
    const typeName = wmsConfig.wfsLayerName || wmsConfig.layerName;
    if (!typeName) return null;
    if (nonGeomColumnsCache.has(typeName)) return nonGeomColumnsCache.get(typeName);

    try {
        const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set('service', 'WFS');
        url.searchParams.set('version', '1.1.0');
        url.searchParams.set('request', 'DescribeFeatureType');
        url.searchParams.set('typeName', typeName);
        url.searchParams.set('outputFormat', 'application/json');
        const res = await fetch(url.toString(), { signal });
        if (!res.ok) { nonGeomColumnsCache.set(typeName, null); return null; }
        const data = await res.json();
        const props = data?.featureTypes?.[0]?.properties || [];
        const columns = props
            .filter(p => !isGeometryProperty(p))
            .map(p => p.name)
            .filter(Boolean);
        const result = columns.length ? columns : null;
        nonGeomColumnsCache.set(typeName, result);
        return result;
    } catch {
        return null;
    }
};

export const buildWCSUrl = (wmsConfig, timeValue) => {
    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wcs');
    const params = {
        service: 'WCS',
        version: '2.0.1',
        request: 'GetCoverage',
        coverageId: wmsConfig.layerName,
        format: 'image/geotiff'
    };
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    if (timeValue) {
        url.searchParams.append('SUBSET', `time("${timeValue}T00:00:00.000Z")`);
    }
    return url.toString();
};

export const buildBackendCSVUrl = (workspace, layerName, dateFrom, dateTo) => {
    const base = `${getApiHost()}/download/${workspace}/${layerName}`;
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
};
