import { findLayerById } from '../../../helpers/layers/utils/layerHelpers';

const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

export const downloadFeaturesAsCSV = (results, allLayers = []) => {
    if (!results || results.length === 0) return;

    const rows = [];
    const allHeaders = new Set(['capa']);

    results.forEach(result => {
        result.features.forEach(feature => {
            Object.keys(feature.properties || {}).forEach(key => allHeaders.add(key));
        });
    });

    const headers = Array.from(allHeaders);
    rows.push(headers.map(escapeCSVValue).join(','));

    results.forEach(result => {
        const layerNode = findLayerById(result.layerId, allLayers);
        const layerName = layerNode?.label || result.layerName || result.layerId;

        result.features.forEach(feature => {
            const row = headers.map(header => {
                if (header === 'capa') return escapeCSVValue(layerName);
                return escapeCSVValue(feature.properties?.[header]);
            });
            rows.push(row.join(','));
        });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `seleccion_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
