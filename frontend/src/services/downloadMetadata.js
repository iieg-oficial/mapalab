const fetchBlob = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('html')) {
        throw new Error('GeoServer error response');
    }
    return response.blob();
};

export const getMetadataFiles = (metadata) => {
    let metadatoList = [];
    if (Array.isArray(metadata?.metadato)) {
        metadatoList = metadata.metadato;
    } else if (metadata?.metadato && typeof metadata.metadato === 'object') {
        metadatoList = [metadata.metadato];
    }
    return metadatoList;
};

export const addMetadataToZip = async (zip, metadatoList, selections) => {
    for (const meta of metadatoList) {
        if (!meta.enlace) continue;
        const filename = meta.enlace.split('/').pop() || 'metadata';
        const ext = filename.split('.').pop()?.toLowerCase();
        if (selections.txt && (ext === 'txt')) {
            try {
                const blob = await fetchBlob(meta.enlace);
                zip.file(filename, blob);
            } catch { /* optional */ }
        }
        if (selections.xlsx && (ext === 'xlsx' || ext === 'xls')) {
            try {
                const blob = await fetchBlob(meta.enlace);
                zip.file(filename, blob);
            } catch { /* optional */ }
        }
    }
};

export const getAvailableMetadata = (metadata) => {
    const metadatoList = getMetadataFiles(metadata);
    let hasTxt = false;
    let hasXlsx = false;
    for (const meta of metadatoList) {
        if (!meta.enlace) continue;
        const ext = meta.enlace.split('.').pop()?.toLowerCase();
        if (ext === 'txt') hasTxt = true;
        if (ext === 'xlsx' || ext === 'xls') hasXlsx = true;
    }
    return { hasTxt, hasXlsx };
};
