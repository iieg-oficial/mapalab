export const buildCatalogoPath = ({ institucionSlug = null, capaSlug = null } = {}) => {
    const segments = ['catalogo'];
    if (institucionSlug) segments.push(institucionSlug);
    if (capaSlug) segments.push(capaSlug);
    return `/${segments.join('/')}`;
};

const buildCatalogoUrl = (path) => {
    const base = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return `${window.location.origin}${base}${path.replace(/^\/+/, '')}`;
};

export const buildCatalogoShareUrl = (params) => buildCatalogoUrl(buildCatalogoPath(params));

export const resolveCatalogoRoute = (seg1, seg2, capas = [], instituciones = []) => {
    if (!seg1) return { institucionSlug: null, capaSlug: null, notFound: false };

    const esInstitucion = instituciones.some((i) => i.slug === seg1);

    if (seg2) {
        return {
            institucionSlug: esInstitucion ? seg1 : null,
            capaSlug: seg2,
            notFound: !esInstitucion,
        };
    }

    const esCapa = capas.some((c) => c.slug === seg1);
    if (esCapa) return { institucionSlug: null, capaSlug: seg1, notFound: false };
    if (esInstitucion) return { institucionSlug: seg1, capaSlug: null, notFound: false };

    return { institucionSlug: null, capaSlug: null, notFound: true };
};

import { generateCQLFilter, parseCQLToSelections } from '@pages/maps/helpers/dateFilterHelpers';
import { describeDateFilter } from '@pages/maps/helpers/dateLoopHelpers';

export const cqlToFechaParam = (cql) => {
    const selections = parseCQLToSelections(cql);
    if (selections.size === 0) return null;
    return [...selections].join(',');
};

export const fechaParamToCql = (param) => {
    if (!param) return null;
    const selections = new Set(param.split(',').map((s) => s.trim()).filter(Boolean));
    return selections.size ? generateCQLFilter(selections) : null;
};

const rasterToFechaParam = (time, periodicidad) => {
    const desc = describeDateFilter({ filter: time, rasterPeriodicity: periodicidad });
    if (!desc) return null;
    return desc.annual ? `${desc.year}` : `${desc.year}-${desc.months[0]}`;
};

const fechaParamToRaster = (param, periodicidad) => {
    const [anio, mes] = param.split(',')[0].trim().split('-');
    const yData = periodicidad?.[parseInt(anio, 10)];
    if (typeof yData === 'string') return mes ? null : yData;
    if (!yData || typeof yData !== 'object') return null;
    if (mes) return yData[parseInt(mes, 10)] || null;
    const meses = Object.keys(yData).map(Number).sort((a, b) => b - a);
    return meses.length ? yData[meses[0]] : null;
};

export const filtroToFechaParam = (filtro, { isRaster = false, periodicidad = null } = {}) => {
    if (!filtro) return null;
    return isRaster ? rasterToFechaParam(filtro, periodicidad) : cqlToFechaParam(filtro);
};

export const fechaParamToFiltro = (param, { isRaster = false, periodicidad = null } = {}) => {
    if (!param) return null;
    return isRaster ? fechaParamToRaster(param, periodicidad) : fechaParamToCql(param);
};

export const filterCapas = (capas, { institucionSlug = null, query = '' } = {}) => {
    const q = query.trim().toLowerCase();
    return capas.filter((capa) => {
        if (institucionSlug && capa.institucion?.slug !== institucionSlug) return false;
        if (!q) return true;
        const inName = capa.nombre?.toLowerCase().includes(q);
        const inTags = (capa.searchTags || []).some((tag) => tag.toLowerCase().includes(q));
        const inInstitucion = capa.institucion?.nombre?.toLowerCase().includes(q)
            || capa.institucion?.slug?.toLowerCase().includes(q);
        return inName || inTags || inInstitucion;
    });
};
