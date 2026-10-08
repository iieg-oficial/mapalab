export const CQL_SIN_RESOLVER = '1=0';

const escapeSingleQuotes = (value) => String(value).replace(/'/g, "''");

const warned = new Set();
const warnOnce = (key, message) => {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[municipioCqlBuilder] ${message}`);
};

const buildInClause = (field, values) => {
    if (!field || !Array.isArray(values) || values.length === 0) return null;
    const inner = values.map(v => `'${escapeSingleQuotes(v)}'`).join(',');
    return `${field} IN (${inner})`;
};

const buildBboxClause = (field, bbox) => {
    if (!field || !Array.isArray(bbox) || bbox.length !== 4) return null;
    const [xmin, ymin, xmax, ymax] = bbox;
    return `BBOX(${field}, ${xmin}, ${ymin}, ${xmax}, ${ymax}, 'EPSG:6368')`;
};

export const buildLayerMunicipioCql = (searchMeta, municipioContext, layerId = null) => {
    if (!municipioContext?.active) return null;
    const listaCargada = (municipioContext.allMunicipiosCount || 0) > 0 && !municipioContext.listLoading;
    if (searchMeta?.hasMunicipio && searchMeta.municipioField) {
        const fieldType = searchMeta.municipioFieldType || 'clave';
        const values = fieldType === 'nombre' ? municipioContext.nombres : municipioContext.claves;
        const valuesLen = Array.isArray(values) ? values.length : 0;
        const clavesLen = Array.isArray(municipioContext.claves) ? municipioContext.claves.length : 0;
        if (fieldType === 'nombre' && clavesLen > 0 && valuesLen < clavesLen && listaCargada) {
            const missing = clavesLen - valuesLen;
            const sampleClaves = (municipioContext.claves || []).slice(0, 5).join(', ');
            warnOnce(
                `${layerId || searchMeta.municipioField}|nombres-incompletos`,
                `Capa "${layerId || searchMeta.municipioField}" usa municipioFieldType=nombre pero ${missing} de ${clavesLen} claves no resolvieron nombre. Claves: [${sampleClaves}]. allMunicipios cargados: ${municipioContext.allMunicipiosCount}. Revisa que las claves seleccionadas existan en mapalab.municipios.`,
            );
        }
        const clause = buildInClause(searchMeta.municipioField, values);
        if (clause) return clause;
        if (listaCargada) {
            const sampleClaves = (municipioContext.claves || []).slice(0, 5).join(', ');
            warnOnce(
                `${layerId || searchMeta.municipioField}|sin-valores`,
                `Capa "${layerId || searchMeta.municipioField}" tiene hasMunicipio=true pero no se pudieron resolver valores (claves=${clavesLen} [${sampleClaves}], nombres=${municipioContext.nombres?.length || 0}, allMunicipios=${municipioContext.allMunicipiosCount}). Cayendo en BBOX fallback.`,
            );
        }
    }
    const bboxClause = buildBboxClause('geom', municipioContext.bbox);
    if (bboxClause) return bboxClause;
    return listaCargada ? null : CQL_SIN_RESOLVER;
};
